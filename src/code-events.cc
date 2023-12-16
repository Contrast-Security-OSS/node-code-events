#include "code-events.h"
#include "event-queue.h"

using namespace v8;

static void DeleteMe(const WeakCallbackInfo<CsiCodeEventHandler> &info) {
    delete info.GetParameter();
}

CsiCodeEventHandler::CsiCodeEventHandler(Isolate *isolate, Local<Object> exports) : CodeEventHandler(isolate) {
    exports_persistent.Reset(isolate, exports);
    exports_persistent.SetWeak(this, DeleteMe, WeakCallbackType::kParameter);
}

CsiCodeEventHandler::~CsiCodeEventHandler() {
    exports_persistent.Reset();
}

// This is boilerplate. It creates a new instance of this class and wraps it
// into a v8::External. The isolate and the exports are necessary, because we
// want the instance of this class to be destroyed along with the exports
// object when the addon is eventually unloaded.
Local<Value> CsiCodeEventHandler::New(Isolate *isolate, Local<Object> exports) {
    return External::New(isolate, new CsiCodeEventHandler(isolate, exports));
}

  //Persistent<Object> CsiCodeEventHandler::exports_persistent;

    void CsiCodeEventHandler::Handle(CodeEvent *event) {
        events.enqueue(event);
    }

    EventNode* CsiCodeEventHandler::dequeue() {
        return this->events.dequeue();
    }

unsigned int CsiCodeEventHandler::eventCount() {
    return this->events.length;
}

//  private:
//    Isolate *isolate;
//    EventQueue events;
//};

////////
//CsiCodeEventHandler *handler;

//NAN_METHOD(initHandler) {
void initHandler(const v8::FunctionCallbackInfo<v8::Value> &info) {
    CsiCodeEventHandler* handler = static_cast<CsiCodeEventHandler*>(info[0].As<External>()->Value());

    //handler = new CsiCodeEventHandler(info.GetIsolate());
    handler->Enable();
}

//NAN_METHOD(deinitHandler) {
void deinitHandler(const v8::FunctionCallbackInfo<v8::Value> &info) {
    CsiCodeEventHandler* handler = static_cast<CsiCodeEventHandler*>(info[0].As<External>()->Value());
    handler->Disable();
}

//NAN_METHOD(getNextCodeEvent) {
void getNextCodeEvent(const v8::FunctionCallbackInfo<v8::Value> &info) {
    CsiCodeEventHandler* handler = static_cast<CsiCodeEventHandler*>(info[0].As<External>()->Value());

    EventNode *node = handler->dequeue();

    if (!node)
        return;

    Local<Object> obj = Nan::New<Object>();

    Nan::Set(obj,
             Nan::New("script").ToLocalChecked(),
             Nan::New(node->script).ToLocalChecked());
    Nan::Set(obj,
             Nan::New("func").ToLocalChecked(),
             Nan::New(node->func).ToLocalChecked());
    Nan::Set(obj,
             Nan::New("type").ToLocalChecked(),
             Nan::New(node->type).ToLocalChecked());
    Nan::Set(obj,
             Nan::New("lineNumber").ToLocalChecked(),
             Nan::New(node->lineNumber));

    info.GetReturnValue().Set(obj);

    delete node;
}
