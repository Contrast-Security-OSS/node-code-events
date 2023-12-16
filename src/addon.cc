#include <nan.h>

#include "code-events.h"

using namespace v8;

// args: exports, module, context
NODE_MODULE_INIT() {
    Isolate *isolate = context->GetIsolate();

    //CsiCodeEventHandler handler = CsiCodeEventHandler(isolate, exports);

    Local<Value> handler = CsiCodeEventHandler::New(isolate, exports);

    exports->Set(context,
        Nan::New("initHandler").ToLocalChecked(),
        v8::FunctionTemplate::New(isolate, initHandler, handler)->GetFunction(context).ToLocalChecked()
    );

}

//NAN_MODULE_INIT(Init) {
//    NAN_EXPORT(target, initHandler);
//    NAN_EXPORT(target, deinitHandler);
//    NAN_EXPORT(target, getNextCodeEvent);
//}
//
//NODE_MODULE(addon, Init)
