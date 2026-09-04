(function(){
  if('BarcodeDetector' in window||typeof window.jsQR!=='function')return;

  let canvas=null;
  let context=null;

  function dimensions(source){
    const width=Number(source?.videoWidth||source?.naturalWidth||source?.width||0);
    const height=Number(source?.videoHeight||source?.naturalHeight||source?.height||0);
    return {width,height};
  }

  function ensureCanvas(width,height){
    if(!canvas){
      canvas=document.createElement('canvas');
      context=canvas.getContext('2d',{willReadFrequently:true});
    }
    if(canvas.width!==width)canvas.width=width;
    if(canvas.height!==height)canvas.height=height;
    return context;
  }

  function scaledSize(width,height){
    const maxDimension=1280;
    if(width<=maxDimension&&height<=maxDimension)return {width,height};
    const scale=Math.min(maxDimension/width,maxDimension/height);
    return {
      width:Math.max(1,Math.round(width*scale)),
      height:Math.max(1,Math.round(height*scale))
    };
  }

  class AlbaQrBarcodeDetector{
    constructor(options={}){
      const formats=Array.isArray(options.formats)?options.formats:[];
      if(formats.length&&!formats.includes('qr_code')){
        throw new TypeError('Only qr_code is supported by the ALBA fallback detector.');
      }
    }

    static async getSupportedFormats(){
      return ['qr_code'];
    }

    async detect(source){
      if(typeof window.jsQR!=='function')return [];
      const sourceSize=dimensions(source);
      if(!sourceSize.width||!sourceSize.height)return [];

      const target=scaledSize(sourceSize.width,sourceSize.height);
      const ctx=ensureCanvas(target.width,target.height);
      if(!ctx)return [];

      try{
        ctx.drawImage(source,0,0,target.width,target.height);
        const image=ctx.getImageData(0,0,target.width,target.height);
        const result=window.jsQR(image.data,target.width,target.height,{inversionAttempts:'attemptBoth'});
        if(!result?.data)return [];
        return [{rawValue:result.data,format:'qr_code'}];
      }catch(error){
        console.debug('ALBA QR fallback frame decode failed',error);
        return [];
      }
    }
  }

  Object.defineProperty(AlbaQrBarcodeDetector,'name',{value:'BarcodeDetector'});
  window.BarcodeDetector=AlbaQrBarcodeDetector;
  window.__ALBA_QR_FALLBACK__='jsQR';
})();
