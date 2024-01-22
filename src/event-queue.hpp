#pragma once

#include <v8-profiler.h>
#include <v8.h>

using namespace v8;

class EventNode {
public:
  char *script;
  char *func;
  int lineNumber;
  const char *type;
  EventNode *next;

  uint64_t size() {
    uint32_t basic = sizeof(*this);
    uint32_t script_size = strlen(this->script);
    uint32_t func_size = strlen(this->func);
    return basic + script_size + func_size;
  }

  ~EventNode() {
    //free(this->type); // don't need to allocate/free - these are consts
    free(this->script);
    free(this->func);
  }
};

/**
 * Implements a simple queue of code events that can be
 * consumed. There's no thread safety because each thread
 * will have its own instance of the class (as part of a
 * CodeEventHandler instance).
 */
class EventQueue {
public:
  EventQueue();
  ~EventQueue();
  void enqueue(char *script_name, char *func_name, int line_number, const char *type);
  EventNode *dequeue();
  unsigned int length;

  uint32_t size() {
    return sizeof(EventQueue);
  }

  uint32_t bytesInQueue() {
    uint32_t bytes = 0;

    EventNode *node = this->head;
    while (node != NULL) {
      bytes += node->size();
      node = node->next;
    }
    return bytes;
  }

private:
  EventNode *head;
  EventNode *tail;
};


EventQueue::EventQueue() {
    this->head = NULL;
    this->tail = NULL;
    this->length = 0;
}

EventQueue::~EventQueue() {
  EventNode *tmp;
  while (this->head != NULL) {
    tmp = this->head;
    this->head = this->head->next;
    delete tmp;
  }
}

void EventQueue::enqueue(char *script_name, char *func_name, int line_number, const char *type) {
    EventNode *node = new EventNode();

    node->script = strdup(script_name);
    node->func = strdup(func_name);
    node->lineNumber = line_number;
    node->type = type;

    if (this->tail) {
        this->tail->next = node;
        this->tail = node;
    } else {
        this->head = node;
        this->tail = node;
    }

    this->length += 1;
}

EventNode *EventQueue::dequeue() {
    EventNode *node = this->head;

    if (!node) {
        return NULL;
    }

    this->head = this->head->next;
    if (this->head == NULL) {
        this->tail = NULL;
    }

    this->length -= 1;

    return node;
}
