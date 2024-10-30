
const customer = require('../routes/customer')
const user = require('../routes/login')

module.exports =  (app) =>{
    app.use('/api/customer', customer)
    app.use('/api/user', user)
}

