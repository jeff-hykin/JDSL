Customers.prototype.UpdateBillingInfo = function(info)
{
    this.cc = info.cc
    this.type = info.type
    this.name = info.name
    this.expM = info.expM
    this.expY = info.expY
    this.ccv = info.ccv

    this.SaveToDatabase()
}