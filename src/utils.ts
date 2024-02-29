import { join } from 'path'
import satori  from 'satori'
import sharp from 'sharp'
import * as fs from "fs";
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import AttestData from './interface';
import { Wallet, ethers } from 'ethers'
import axios from 'axios'
import e from 'express';

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
    console.log(imageData)
    return imageData
}

const onchainAttestation = async (attestObj: AttestData) => {
    const easContractAddress = process.env.EASCONTRACTADDRESS as string
    const schemaUID = process.env.SCHEMAUID as string
    const eas = new EAS(easContractAddress!)
    const provider = new ethers.JsonRpcProvider('https://sepolia.base.org')
    const signer = new ethers.Wallet(process.env.PVTKEY as string, provider)
    eas.connect(signer)

    const schemaEncoder = new SchemaEncoder("string fromFID,string[] toFID,string message,string fromOTTPID,string[] toOTTPID,string type,string project");
    const encodedData = schemaEncoder.encodeData([
	    { name: "fromFID", value: attestObj.fromFID, type: "string" },
	    { name: "toFID", value: attestObj.toFID!, type: "string[]" },
	    { name: "message", value: attestObj.message, type: "string" },
	    { name: "fromOTTPID", value: attestObj.fromOTTPID!, type: "string" },
	    { name: "toOTTPID", value: attestObj.toOTTPID!, type: "string[]" },
	    { name: "type", value: attestObj.type!, type: "string" },
	    { name: "project", value: attestObj.project!, type: "string" }
    ])

    const tx = await eas.attest({
        schema: schemaUID,
        data: {
            recipient: "0x0000000000000000000000000000000000000000",            
            revocable: false, // Be aware that if your schema is not revocable, this MUST be false
            data: encodedData,
        },
    });
    const newAttestationUID = await tx.wait();
    console.log("New attestation UID:", newAttestationUID)
    return newAttestationUID

}

const getFidFromFname = async (fname: string): Promise<string> => { 
    if (!fname) 
        throw new Error ('Fname cannot be empty')
    try {
        const fData = JSON.parse(await axios.get(`https://fnames.farcaster.xyz/transfers/current?name=${fname}`))
        return fData.transfers[0].id
    } catch (err) {
        throw(err)
    }
    
}

const getFnamesFromFrame = (text: string): string[] => {
    const usernamePattern = /@\w+/g            
    const matches = text.match(usernamePattern)            
    if (!matches) {
        return [];
    }
    return matches.map(username => username.substring(1));
}

const getFids = async(text: string): Promise<string[]> => {
    if (!text)
        throw new Error ('Fnames cannot be empty')
    try {
        const fnames: string[] = getFnamesFromFrame(text)
        let fidArray: string[] = []
        for (let fname of fnames) {
            fidArray.push(await getFidFromFname(fname))
        }
        console.log(fidArray)
        return fidArray
    } catch (err) {
        throw(err)
    }
}
    
    


export {toPng, onchainAttestation, getFids}
