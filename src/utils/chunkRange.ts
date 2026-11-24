export function chunkRange (
    arr: number[], 
    len: number
): number[][] {

    const chunks = [],
        n = arr.length;
    let i = 0;
  
    while (i < n) {
      chunks.push(arr.slice(i, i += len));
    }
  
    return chunks;
  }