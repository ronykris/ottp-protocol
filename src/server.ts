import { FrameInputMetadata, FrameRequest, getFrameHtmlResponse, getFrameMessage } from '@coinbase/onchainkit'
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import {toPng, onchainAttestation, getFids}  from './utils'
import {AttestData } from './interface'

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

const port = process.env.PORT || 4001
let fids: string[] = []

app.get('/', (req, res) => {    
    if (req.method !== 'GET') {
        throw new Error ('Error: ' + req.method + 'is not supported')
    }  
    res.status(200).send(
    getFrameHtmlResponse({
        buttons: [
            {
                "label": "Next",
                "action": 'post',                
            }
        ],
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABHoAAAJYCAYAAAAde4FyAAAbt0lEQVR4nO3dO8wlZ2HG8ZMWTGnANCA5ciQoQLGdxpG8pIijYNMQI9lIwSkwEk7DxaRKMFAFY9LESDFF7CK2RELDkgg3ySLFTcBRKEDCiiVouLnE0Cbn+VZjvwwz35m9nGN4+P2k2T2735nbO6eZv9453+/c+u57/28HAAAAwG88oQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAA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AAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQIn/B/1FOc2E7mMPAAAAAElFTkSuQmCC',
        input: {text: 'Who did you collaborate with? eg: @ottp'},        
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
    console.log(body.untrustedData.inputText)    
    getFids(body.untrustedData.inputText)
        .then((frameFids) => frameFids = fids)
        .catch((error) => console.error(error))
        
    res.status(200).send(
        getFrameHtmlResponse({
            buttons: [
                {
                    "label": "Attest",
                    "action": 'post',                
                }
            ],
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABHoAAAJYCAYAAAAde4FyAAAbt0lEQVR4nO3dO8wlZ2HG8ZMWTGnANCA5ciQoQLGdxpG8pIijYNMQI9lIwSkwEk7DxaRKMFAFY9LESDFF7CK2RELDkgg3ySLFTcBRKEDCiiVouLnE0Cbn+VZjvwwz35m9nGN4+P2k2T2735nbO6eZv9453+/c+u57/28HAAAAwG88oQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAA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AAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQAmhBwAAAKCE0AMAAABQQugBAAAAKCH0AAAAAJQQegAAAABKCD0AAAAAJYQeAAAAgBJCDwAAAEAJoQcAAACghNADAAAAUELoAQAAACgh9AAAAACUEHoAAAAASgg9AAAAACWEHgAAAIASQg8AAABACaEHAAAAoITQAwAAAFBC6AEAAAAoIfQAAAAAlBB6AAAAAEoIPQAAAAAlhB4AAACAEkIPAAAAQIn/B/1FOc2E7mMPAAAAAElFTkSuQmCC',
            input: {text: 'What did you co-create?'},        
            ogTitle: "OTTP: Shoutout!",
            postUrl: process.env.HOST+'/attest',          
        })
    )
})

app.post('/attest', async (req, res) => {    
    if (req.method !== 'POST') {
        throw new Error ('Error: ' + req.method + 'is not supported')
    }  
    console.log(req.method)    
    const body: FrameRequest = await req.body
    console.log(body.untrustedData.inputText)
    let attestDataObj: AttestData = {
        fromFID: body.untrustedData.fid as unknown as string,
        toFID: fids,
        message: body.untrustedData.inputText
    }

    const attestTxn = await onchainAttestation(attestDataObj)
    console.log(attestTxn)
    
    res.status(200).send(
        getFrameHtmlResponse({
            buttons: [
                {
                    "label": "Share",
                    "action": "link",
                    "target": ""
                },
                {
                    "label": "Go to /ottp",
                    "action": "link",
                    "target": ""
                },
                {
                    "label": "View Attestation",
                    "action": "link",
                    "target": ""
                }
            ],
            image: await toPng(body.untrustedData.inputText),
            ogTitle: "OTTP: Shoutout!",            
        })
    )

})

app.listen(port, () => {
    console.log('listening on port ' + port)
})