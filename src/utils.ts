import { EAS, SchemaEncoder, TransactionSigner } from '@ethereum-attestation-service/eas-sdk';
import {AttestData} from './interface';
import { ethers } from 'ethers'
import axios from 'axios'

const onchainAttestation = async (attestObj: AttestData) => {
    try {
        const easContractAddress = process.env.EASCONTRACTADDRESS as string
        const schemaUID = process.env.SCHEMAUID as string
        const eas = new EAS(easContractAddress!)
        const provider = new ethers.JsonRpcProvider('https://sepolia.base.org')    
        const signer = new ethers.Wallet(process.env.PVTKEY as string, provider)
        eas.connect(signer as unknown as TransactionSigner)
        
        const schemaEncoder = new SchemaEncoder("string fromFID,string data")
        const encodedData = schemaEncoder.encodeData([
	        { name: "fromFID", value: attestObj.fromFID, type: "string" },
	        { name: "data", value: attestObj.data, type: "string" }	        
        ])

        const tx = await eas.attest({
            schema: schemaUID,
            data: {
                recipient: "0x0000000000000000000000000000000000000000",            
                revocable: true, // Be aware that if your schema is not revocable, this MUST be false
                data: encodedData,
            },
        });
        const newAttestationUID = await tx.wait()        
        return newAttestationUID
    } catch (err) {
        console.log(err)
    }    
}

const getFidFromFname = async (fname: string): Promise<string> => { 
    if (!fname) 
        throw new Error ('Fname cannot be empty')
    try {
        const response = await axios.get(`https://fnames.farcaster.xyz/transfers/current?name=${fname}`)
        //console.log(response.data)        
        return response.data?.transfer?.id
    } catch (err) {
        throw(err)
    }
}

const getTaggedData = (text: string): string[] => {
    const taggedDataPattern = /@\w+/g            
    const matches = text.match(taggedDataPattern)            
    if (!matches) {
        return [];
    }
    return matches.map(taggedData => taggedData.substring(1));
}

const getFids = async(text: string): Promise<string[]> => {
    if (!text)
        throw new Error ('Fnames cannot be empty')
    try {
        const fnames: string[] = getTaggedData(text)     
        let fidArray: string[] = []
        if (!fnames){
            return fidArray
        } else {
            for (let fname of fnames) {
                fidArray.push(await getFidFromFname(fname))
            }            
            return fidArray
        }
    } catch (err) {
        throw(err)
    }
}

const validateCollabUserInput = (text: string): boolean => {
    // Identify segments starting with '@' and possibly followed by any characters
    // except for spaces, punctuation, or special characters (excluding '@').
    const segments = text.match(/@\w+/g) || [];

    // Validate that the original text only contains the valid segments and separators.
    // Rebuild what the valid text should look like from the segments.
    const validText = segments.join(' '); // Using space as a generic separator for validation.

    // Further process the text to remove all valid segments, leaving only separators.
    // This step checks if there are any extra characters or segments that don't start with '@'.
    const remainingText = text.replace(/@\w+/g, '').trim();

    // Check if the remaining text contains only spaces, punctuation, or special characters (excluding '@').
    // This can be adjusted based on the specific separators you expect between words.
    const isValidSeparators = remainingText.length === 0 || /^[^@\w]+$/g.test(remainingText);

    // Ensure every identified segment starts with '@' and contains no additional '@'.
    const isValidSegments = segments.every(segment => segment.startsWith('@') && !segment.slice(1).includes('@'));

    // The text is valid if the separators are valid, and all segments start with '@' without additional '@'.
    return isValidSegments && isValidSeparators;
};


export {onchainAttestation, getFids, validateCollabUserInput, getTaggedData}
