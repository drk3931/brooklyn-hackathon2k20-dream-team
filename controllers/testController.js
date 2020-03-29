//written by deepak khemraj github.com/drk3931

function testing(req,res)
{

    setTimeout(()=>{
        res.status(200).json({message:'complete'})
    },10000)
    
}

module.exports = {testing : testing}