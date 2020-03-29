function testing(req,res)
{

    setTimeout(()=>{
        res.status(200).json({message:'complete'})
    },10000)
    
}

module.exports = {testing : testing}