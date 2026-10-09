declare const sdk: {
 init(options: {appid:string;onError:(result:{error:unknown})=>void;onClientId:(result:{cid:string})=>void;onlineState:(result:{online:boolean})=>void;onPushMsg:(result:{message:string})=>void}):void;
 enableSocket(enabled:boolean):void;
};
export = sdk;
