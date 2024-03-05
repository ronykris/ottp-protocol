import { FrameInputMetadata, FrameRequest, getFrameHtmlResponse, getFrameMessage } from '@coinbase/onchainkit'
import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import {toPng, onchainAttestation, getFids, validateCollabUserInput, getTaggedData}  from './utils'
import {AttestData } from './interface'
import { frame1, frame2, frame3 } from './image'

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

const port = process.env.PORT || 4001
var fids: string[] = []
var collabUsers: string = ''

//console.log(`HOST : ${process.env.HOST}`)

app.listen(port, () => {
    console.log('listening on port ' + port)
})

app.get('/', (req, res) => {    
    if (req.method !== 'GET') {
        throw new Error ('Error: ' + req.method + 'is not supported')
    }  
    res.status(200).send(
    getFrameHtmlResponse({
        buttons: [
            {
                "label": "Next",
                "action": "post",                
            }
        ],        
        image: frame1,
        input: {text: 'Tag collaborators e.g. @df @v'},        
        ogTitle: "OTTP: Shoutout!",
        postUrl: process.env.HOST+'/next',          
    })    
    )
})

app.post('/next', async(req, res) => {
    if (req.method !== 'POST') {
        throw new Error ('Error: ' + req.method + 'is not supported')
    }
    const body: FrameRequest = await req.body
    let inputText: string = body.untrustedData.inputText
    //console.log(inputText)
    if(validateCollabUserInput(inputText)){
        collabUsers = inputText
        getFids(inputText)
            .then((frameFids) => fids = frameFids)
            .catch((error) => console.error(error))
        
        res.status(200).send(
            getFrameHtmlResponse({
                buttons: [
                    {
                        "label": "Back",
                        "action": 'post',                                                   
                    },
                    {
                        "label": "Attest",
                        "action": 'post',                
                    }
                ],
                image: frame2,
                input: {text: 'Project @farcastar'},        
                ogTitle: "OTTP: Shoutout!",
                postUrl: process.env.HOST+'/attest',          
            })
        )
    } else {
        res.status(200).send(
            getFrameHtmlResponse({
                buttons: [
                    {
                        "label": "Next",
                        "action": "post",                
                    }
                ],
                image: frame1,
                input: {text: 'Tag collaborators e.g. @df @v'},        
                ogTitle: "OTTP: Shoutout!",
                postUrl: process.env.HOST+'/next',          
            })
        )
    }
})

app.post('/attest', async (req, res) => {    
    if (req.method !== 'POST') {
        throw new Error ('Error: ' + req.method + 'is not supported')
    }
    const body: FrameRequest = await req.body
    if (body.untrustedData.buttonIndex !== 1) {
        let inputText: string = body.untrustedData.inputText
        //console.log(inputText)
        //console.log(fids)
        let project: string[] = getTaggedData(inputText)
        //console.log('project: ' + project)
    
        /*let attestDataObj: AttestData = {
            fromFID: body.untrustedData.fid as unknown as string,
            toFID: fids,
            message: body.untrustedData.inputText as unknown as string
        }*/
        let data: any = {}
        data.toFID = fids
        data.message = inputText
        data.project = project
        
        let attestDataObj: AttestData = {
            fromFID: (body.untrustedData.fid).toString(),
            data: JSON.stringify(data)
        }
        const attestTxn = await onchainAttestation(attestDataObj)
        //console.log(attestTxn)
    
        res.status(200).send(
            getFrameHtmlResponse({
                buttons: [
                    {
                        "label": "Share",
                        "action": "link",
                        "target": "https://example.com"
                    },
                    {
                        "label": "Go to /ottp",
                        "action": "link",
                        "target": "https://example.com"
                    },
                    {
                        "label": "View Attestation",
                        "action": "link",
                        "target": `https://base-sepolia.easscan.org/attestation/view/${attestTxn}`
                    }
                ],
                //image: await toPng(body.untrustedData.inputText),
                image: frame3,
                ogTitle: "OTTP: Shoutout!",            
            })
        )
    } else {
        res.status(200).send(
            getFrameHtmlResponse({
                buttons: [
                    {
                        "label": "Next",
                        "action": "post",                
                    }
                ],
                image: frame1,
                input: {text: 'Tag collaborators e.g. @df @v'},        
                ogTitle: "OTTP: Shoutout!",
                postUrl: process.env.HOST+'/next',          
            })
        )
    }
})
