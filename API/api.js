const express = require('express')
const mongoose = require('mongoose')
const user = require('./user.controller')
const app = express()
const port = 3000
const cors = require('cors'); // Importa el módulo cors

mongoose.connect('mongodb+srv://vichofarias:vichofariasJalvarez2001@cluster0.cxhsze4.mongodb.net/miapp?retryWrites=true&w=majority')

app.use(cors());
app.use(express.json())

app.get('/users',user.list)
app.post('/users',user.create)
app.get('/users/:id',user.get)
app.put('/users/:id',user.update)
app.patch('/users/:id',user.update)
app.delete('/users/:id',user.destroy)

app.use(express.static('app'))


app.get('/', (req,res) => {
    console.log(__dirname)
    res.sendFile(__dirname + '/index.html');

})

app.get('*',(req, res) => {
    res.status(404).send('Esta Pagina No Existe')
})


app.listen(port,() => {
    console.log ('Arrancando La Aplicacion')
})
