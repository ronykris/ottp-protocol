interface AttestData {
    fromFID: string,
    toFID?: string[],
    message: string,
    fromOTTPID?: string,
    toOTTPID?: string[],
    type?: string,    
    project?: string
}

export  {AttestData}