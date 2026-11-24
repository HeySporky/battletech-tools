export function breakLines(
    incomingLine: string,
    lineLength: number
): string[] {

    const rv: string[] = [];

    const splitWords = incomingLine.split(" ");

    let line = "";
    for( const word of splitWords ) {
        if( word.length + line.length <= lineLength ) {
            line += word + " ";
        } else {
            rv.push( line.trim() );
            line = "";
            line += word + " ";
        }
    }
    rv.push( line.trim() );

    return rv;
}