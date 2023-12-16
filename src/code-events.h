#pragma once

#include <nan.h>
#include <v8-profiler.h>
#include <v8.h>

#include "event-queue.h"

//NAN_METHOD(initHandler);
//NAN_METHOD(deinitHandler);
//NAN_METHOD(getNextCodeEvent);
void initHandler(const v8::FunctionCallbackInfo<v8::Value> &info);
void deinitHandler(const v8::FunctionCallbackInfo<v8::Value> &info);
void getNextCodeEvent(const v8::FunctionCallbackInfo<v8::Value> &info);

class CsiCodeEventHandler : public v8::CodeEventHandler {
  public:
      explicit CsiCodeEventHandler(v8::Isolate *isolate, v8::Local<v8::Object> exports);
      ~CsiCodeEventHandler();
      static v8::Local<v8::Value> New(v8::Isolate *isolate, v8::Local<v8::Object> exports);
      void Handle(v8::CodeEvent *event);
      EventNode *dequeue();
      unsigned int eventCount();
      Persistent<Object> exports_persistent;

  private:
      v8::Isolate *isolate;
      v8::CodeEvent *head;
      v8::CodeEvent *tail;
      unsigned int length;
      EventQueue events;
};
