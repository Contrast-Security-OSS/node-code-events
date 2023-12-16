#include <nan.h>

#include "code-events.h"

using namespace v8;

// args: exports, module, context
NODE_MODULE_INIT() {
    Isolate *isolate = context->GetIsolate();

    Local<Value> handler = CsiCodeEventHandler::New(isolate, exports);

    exports->Set(context,
        Nan::New("initHandler").ToLocalChecked(),
        v8::FunctionTemplate::New(isolate, initHandler, handler)->GetFunction(context).ToLocalChecked()
    );

    exports->Set(context,
        Nan::New("deinitHandler").ToLocalChecked(),
        v8::FunctionTemplate::New(isolate, deinitHandler, handler)->GetFunction(context).ToLocalChecked()
    );

    exports->Set(context,
        Nan::New("getNextCodeEvent").ToLocalChecked(),
        v8::FunctionTemplate::New(isolate, getNextCodeEvent, handler)->GetFunction(context).ToLocalChecked()
    );
}
