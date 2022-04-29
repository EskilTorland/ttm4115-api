import express, {NextFunction,Request,Response} from "express"
import dotenv from "dotenv"

const app = express()
dotenv.config()
import {Pool} from 'pg'
import https from 'https'

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432")
})

const connectToDb = async () => {
    try {
        await pool.connect()
    } catch(e) {
        console.log(e)
    }
}
connectToDb()

const req = https.get("https://opentdb.com/api.php?amount=10&type=multiple",res => {
    let data: any = []
    console.log(res.statusCode)
    res.on('data',chunk => {
        data.push(chunk)
    })
    res.on('end', () => {
        let response = JSON.parse(data)
        let test = response.results[1]
        console.log(test.type)
    })
})


app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.send("hi")
})

app.listen(process.env.PORT, () => {
    console.log(`Server is running at ${process.env.PORT}`)
})