Customers.prototype.SaveToDatabase = function(info)
{
    console.log(`saving to database`, {
        cc: this.cc,
        type: this.type,
        name: this.name,
        expM: this.expM,
        expY: this.expY,
        ccv: this.ccv,
    })
}