const axios = require('axios');

exports.login = async(req,res) => {
    try{
        let url = 'http://192.168.1.24:3400/api/admin/login';
        const result = await axios({
            method : "POST",
            url : url,
            data : req.body,
        }).then((resp) =>{
            console.log(resp);
            console.log(resp.data.statusCode);
            
            if(resp.data.statusCode === 200){
                return res.status(resp.data.statusCode).send(resp.data);
            }
        }).catch((err) =>{
            console.log(err.response.data);
            return res.status(500).send(err.response.data)
        }
        )
    }catch(e){
        console.log(e);
        
        res.status(500).send(e.message);
    }
}


exports.logout = async(req,res) => {
    console.log(req.headers);
    
    try{
        let url = 'http://192.168.1.24:3400/api/admin/logout';
        const result = await axios({
            method : "GET",
            url : url,
            data : req.body,
            headers : req.headers
        }).then((resp) =>{
            if(resp.data.statusCode === 200){
                return res.status(resp.data.statusCode).send(resp.data);
            }
        }).catch((err) =>{
            console.log(err);
            return res.status(err.status).send(err.response.data)
        }
        )
    }catch(e){
        console.log(e);
        
        res.status(500).send(e.message);
    }
}