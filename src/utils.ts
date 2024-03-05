import { join } from 'path'
import satori  from 'satori'
import sharp from 'sharp'
import * as fs from "fs";
import { EAS, SchemaEncoder, SchemaValue, TransactionSigner } from '@ethereum-attestation-service/eas-sdk';
import {AttestData} from './interface';
import { ethers } from 'ethers'
import axios from 'axios'

const getHtmlElement = async(text: string) => {    
    try {
        const { html } = await import('satori-html')
        const htmlElement = html`<style>
        .gradient-element {
          background: linear-gradient(to right, #ade8f4, #caf0f8);
          padding: 20px;
          margin: 20px auto; /* Center the element horizontally */
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: 600px; /* Specify width */
          height: 400px; /* Specify height */
          display: flex;
          flex-direction: column;
          text-align: center; /* Ensure text alignment is centered for all text */
        }
      
        .gradient-element h2 {
          color: #0077b6;
          margin-bottom: 15px; /* Adjust or remove margin as needed */
        }
      
        .center-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center; /* Center content vertically */
          align-items: center; /* Center content horizontally */
        }
      
        .gradient-element p {
          color: #023e8a;
          margin: 0;
          padding: 0 10px;
        }
      </style>
      
      <div class="gradient-element">
        <h2>Centered Heading</h2>
        <div class="center-content">
          <p>${text}</p>
        </div>
      </div>`
        
        return htmlElement
    } catch (e) {
        console.error(e)
    }  
}

const toPng = async (text: string) => {
    const fontPath = join(process.cwd(), 'Roboto-Regular.ttf')
    let fontData = fs.readFileSync(fontPath)
    const svg = await satori(
        await getHtmlElement(text),
        {
            width: 600, height: 400,
            fonts: [{
                data: fontData,
                name: 'Roboto',
                style: 'normal',
                weight: 400
            }]
        })
    
    // Convert SVG to PNG using Sharp
    const pngBuffer = await sharp(Buffer.from(svg))
        .toFormat('png')
        .toBuffer();    
    const imageData = 'data:image/png;base64,'+ pngBuffer.toString('base64')
    //console.log(imageData)
    return imageData
}

const onchainAttestation = async (attestObj: AttestData) => {
    try {
        const easContractAddress = process.env.EASCONTRACTADDRESS as string
        const schemaUID = process.env.SCHEMAUID as string
        const eas = new EAS(easContractAddress!)
        const provider = new ethers.JsonRpcProvider('https://sepolia.base.org')    
        const signer = new ethers.Wallet(process.env.PVTKEY as string, provider)
        eas.connect(signer as unknown as TransactionSigner)

        //const schemaEncoder = new SchemaEncoder("string fromFID,string[] toFID,string message,string fromOTTPID,string[] toOTTPID,string type,string project")
        const schemaEncoder = new SchemaEncoder("string fromFID,string data")
        //console.log(attestObj)
        
        /*const encodedData = schemaEncoder.encodeData([
	        { name: "fromFID", value: attestObj.fromFID, type: "string" },
	        { name: "toFID", value: attestObj.toFID!, type: "string[]" },
	        { name: "message", value: attestObj.message, type: "string" },
	        { name: "fromOTTPID", value: '', type: "string" },
	        { name: "toOTTPID", value: '', type: "string[]" },
	        { name: "type", value: '', type: "string" },
	        { name: "project", value: '', type: "string" }
        ])*/

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
        const newAttestationUID = await tx.wait();
        //console.log("New attestation UID:", newAttestationUID)
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
        //console.log(fnames)
        let fidArray: string[] = []
        if (!fnames){
            return fidArray
        } else {
            for (let fname of fnames) {
                fidArray.push(await getFidFromFname(fname))
            }
            //console.log(fidArray)
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

export {toPng, onchainAttestation, getFids, validateCollabUserInput, getTaggedData}
