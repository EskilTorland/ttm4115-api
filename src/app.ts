import express, {NextFunction,Request,Response} from "express"
import dotenv from "dotenv"

const app = express()
dotenv.config()
import {Pool} from 'pg'
import https from 'https'
import db from "./queries"
import pg from "pg-promise/typescript/pg-subset"
import { executionAsyncResource } from "async_hooks"

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432")
})


const execute = async(query:string) =>{
    try{
        await pool.connect()
        await pool.query(query)
        return true
    }catch(e){
        console.error(e)
        return false
    }
}

const createQuizTable = `
CREATE TABLE IF NOT EXISTS "quiz" (
    "id" SERIAL,
     "question" VARCHAR(512) NOT NULL,
     "answers" VARCHAR(1000) NOT NULL
);`

execute(createQuizTable).then(result =>{
    if(result){
        console.log("Table created")
    }
})

const insertQuiz = async(question:string,answers:string) =>{
    try{
        await pool.connect()
        await pool.query(
            `INSERT INTO "quiz" ("question", "answers")
             VALUES ($1, $2)`, [question,answers]
        )
        return true
    } catch(e){
        console.error(e)
    }
}

insertQuiz("spm","ans").then(result =>{
    if(result){
        console.log("Quiz inserted2")
    }
})

const fetchQuiz = async() =>{
    try {
       await pool.connect()
       return await pool.query(`SELECT * FROM "quiz"`)
    } catch (e) {
        console.log(e)
    }

}

fetchQuiz()

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
        for(let i = 0; i < response.results.length; i++){

        }
        let test = response.results.length
        console.log(test)
    })
})

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.send("hi")
})
app.get("/getQuiz", (req: Request, res: Response, next: NextFunction) =>{
    fetchQuiz().then(result => console.log(result?.rows))
    fetchQuiz().then(result => res.send(result?.rows))
})

app.listen(process.env.PORT, () => {
    console.log(`Server is running at ${process.env.PORT}`)
})