//#include <nan.h>
#include <napi.h>
#include <node_version.h>

#include "CodeEventHandler.hpp"

using Napi::Addon;
using Napi::CallbackInfo;
using Napi::Env;
using Napi::Object;
using Napi::Value;

namespace csi {

class CodeEvents : public Addon<CodeEvents> {
private:
    csi::CodeEventHandler *handler;

    const uint32_t default_exclusions = kExcludeNodeScripts | kExcludeNonFunctionTypes;

    Napi::Value Start(const CallbackInfo &info) {
        Env env = info.Env();
        uint32_t bits = default_exclusions;
        if (info.Length() > 0) {
            bits = info[0].As<Napi::Number>().Int32Value();
        }
        handler->enable(bits);

        // return the bits that were enabled.
        return Napi::Number::New(env, bits);
    }

    Napi::Value Stop(const CallbackInfo &info) {
        handler->disable();
        return info.Env().Undefined();
    }

    Napi::Value GetEvent(const CallbackInfo &info) {
        Env env = info.Env();

        Napi::Value event = handler->getEvent(env);
        return event;
    }

    Napi::Value Stats(const CallbackInfo &info) {
        Env env = info.Env();

        Napi::Object stats = handler->getStats(env);
        return stats;
    }

    // changed to return the size of the handler instance
    Napi::Value Noop(const CallbackInfo &info) {
      return info.Env().Null();
    }

    // return size of the handler + size of the handler's queue.
    Napi::Value Size(const CallbackInfo &info) {
        enum sizeCode {
            kHandler = 1,
            kQueueInstance = 2,
            kQueueItems = 3,
            kCurrentQueueLength = 4,
        };

        uint32_t size_code = info[0].As<Napi::Number>().Int32Value();

        uint32_t bytes;
        if (size_code == kHandler) {
            bytes = handler->size();
        } else if (size_code == kQueueInstance) {
            bytes = handler->sizeOfQueueInstance();
        } else if (size_code == kQueueItems) {
            bytes = handler->bytesInQueue();
        } else if (size_code == kCurrentQueueLength) {
            bytes = handler->queueLength();
        }

        return Napi::Number::New(info.Env(), bytes);
    }

    Napi::Value LoseMemory(const CallbackInfo &info) {
        if (info.Length() > 0) {
            uint32_t lose_count = info[0].As<Napi::Number>().Int32Value();
            void *m;
            while (lose_count-- > 0) {
                m = malloc(1000);
            }
        }
        return info.Env().Undefined();
    }

  public:
    CodeEvents(Env env, Napi::Object exports) {
      v8::Isolate *isolate = v8::Isolate::GetCurrent();

      handler = new csi::CodeEventHandler(isolate);

      DefineAddon(exports, {
                        InstanceMethod("start", &CodeEvents::Start),
                        InstanceMethod("stop", &CodeEvents::Stop),
                        InstanceMethod("getEvent", &CodeEvents::GetEvent),
                        InstanceMethod("stats", &CodeEvents::Stats),
                        InstanceMethod("noop", &CodeEvents::Noop),
                        InstanceMethod("size", &CodeEvents::Size),
                        InstanceMethod("loseMemory", &CodeEvents::LoseMemory),
      });
  }
};

NODE_API_ADDON(CodeEvents)
} // namespace csi
