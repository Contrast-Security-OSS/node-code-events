#pragma once

#include "event-queue.hpp"
#include "nan.h"
#include <napi.h>
#include <v8-profiler.h>
#include <v8.h>

using Napi::Array;
using Napi::Env;
using Napi::Object;
using Napi::Value;

// less one for ASCIZ
#define EXCLUDE_PREFIX "node:"
const size_t min_match = sizeof(EXCLUDE_PREFIX) - 1;

namespace csi {

enum CodeEventExclusions {
  kExcludeNodeScripts = 1 << 0,
  kExcludeNonFunctionTypes = 1 << 1,
};

class CodeEventHandler : public v8::CodeEventHandler {
public:
  explicit CodeEventHandler(v8::Isolate *isolate);
  ~CodeEventHandler();
  void Handle(v8::CodeEvent *event);
  void enable(uint64_t bits);
  void disable();
  Napi::Value getEvent(Napi::Env env);
  Napi::Object getStats(Napi::Env env);
  uint32_t size() {
    return sizeof(*this);
  }
  uint32_t sizeOfQueueInstance() {
    return sizeof(queue);
  }
  uint32_t bytesInQueue() {
    return queue.bytesInQueue();
  }
  uint32_t queueLength() {
    return queue.length;
  }

private:
  EventQueue queue;

  // event counters
  uint64_t total;
  uint64_t not_function;
  uint64_t total_node_scripts;
  uint64_t no_script_name;
  uint64_t total_queued;

  bool exclude_node_scripts;
  bool exclude_non_function_types;
};

CodeEventHandler::CodeEventHandler(v8::Isolate *isolate) : v8::CodeEventHandler(isolate) {
  // the counters are in the order they are checked.
  this->total = 0; // total events seen
  this->not_function = 0; // count of events that were not a function
  this->total_node_scripts = 0; // count of events that were node: scripts
  this->no_script_name = 0; // count of events that had no script name
  this->total_queued = 0; // count of events queued for processing
}

CodeEventHandler::~CodeEventHandler() {}

void CodeEventHandler::enable(uint64_t bits) {
    this->total = 0;
    this->not_function = 0;
    this->total_node_scripts = 0;
    this->no_script_name = 0;
    this->total_queued = 0;

    this->exclude_node_scripts = (bits & kExcludeNodeScripts) != 0;
    this->exclude_non_function_types = (bits & kExcludeNonFunctionTypes) != 0;

    this->Enable();
}

void CodeEventHandler::disable() {
    this->Disable();
}

void CodeEventHandler::Handle(v8::CodeEvent *event) {
    this->total++;

    const char *type = NULL;
    uint32_t line_number = 0;

    // if it's not one of the function types and we're excluding them, don't
    // do anything more.
    const v8::CodeEventType code_type = event->GetCodeType();

    bool not_function = (code_type != v8::CodeEventType::kFunctionType &&
                         code_type != v8::CodeEventType::kLazyCompileType);
    if (this->exclude_non_function_types) {
        if (not_function) {
            this->not_function++;
            return;
        }
    } else {
        if (not_function) {
            this->not_function++;
        }
        type = event->GetCodeEventTypeName(code_type);
    }

    // get the script name. convert to UTF8 here so we can compare, but pass
    // it to the queue so we don't have to convert it again.
    Nan::Utf8String script_name(event->GetScriptName());

    if (script_name.length() == 0) {
        this->no_script_name++;
        return;
    }

    line_number = event->GetScriptLine();

    // when requested, skip if it's a node: script (note that node: wasn't a
    // prefix in early node versions, but we're not supporting them.)
    if (strncmp(EXCLUDE_PREFIX, *script_name, min_match) == 0) {
        this->total_node_scripts++;
        if (this->exclude_node_scripts) {
            return;
        }
    }

    Nan::Utf8String function_name(event->GetFunctionName());

    this->total_queued++;
    queue.enqueue(*script_name, *function_name, line_number, type);
}

Napi::Value CodeEventHandler::getEvent(Napi::Env env) {
    EventNode *node = queue.dequeue();
    if (node == NULL) {
        return env.Null();
    }
    Napi::Object event = Napi::Object::New(env);
    event.Set("script", node->script);
    event.Set("func", node->func);
    event.Set("lineNumber", node->lineNumber);
    if (node->type != NULL) {
        event.Set("type", node->type);
    }

    delete node;

    return event;
}

Napi::Object CodeEventHandler::getStats(Napi::Env env) {
    Napi::Object stats = Napi::Object::New(env);
    stats.Set("total", this->total);
    stats.Set("not_function", this->not_function);
    stats.Set("total_node_scripts", this->total_node_scripts);
    stats.Set("no_script_name", this->no_script_name);
    stats.Set("total_queued", this->total_queued);
    return stats;
}

} // namespace csi
