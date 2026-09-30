export const MAX_PRODUCT_VIDEOS=5;
export const MAX_VIDEO_BYTES=4*1024*1024;
export const VIDEO_CHUNK_BYTES=512*1024;
export const videoPathPattern=/^\/api\/video\/[a-f0-9-]+\.(mp4|webm)$/;
export function productVideos(product:{videos?:string[]}):string[]{return product.videos?[...product.videos]:[];}
