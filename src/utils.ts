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
    // Split the text into words based on spaces and punctuation.
    const words = text.match(/\b\w+@\w*\b/g) || []    
    return words.every(word => {
        // Count '@' occurrences and ensure the word starts with '@'
        const atCount = word.split('').filter(char => char === '@').length;
        return word.startsWith('@') && atCount === 1;
    });
}

export {onchainAttestation, getFids, validateCollabUserInput, getTaggedData}
