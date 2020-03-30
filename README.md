Dream Team Leaf Backend
Live server @ https://brooklyn-hackathon.herokuapp.com
ALL REQUESTS USE ONLY THE POST METHOD

Phone needs to be 10 digit number (no dashes) for twilio,
zipcode needs to be 5 digits and will only apply to NYC for now

Register User /api/createUser
    "phone":"6666666666",
    "password":"supersecretpass",
    "zipcode":"34202"
}
Returns 200 on user creation success


Login User /api/loginUser
{
    "phone":"6666666666",
    "password":"supersecretpass",
}
Returns auth token on success


Add item to donate (upon addition, geolocation calls are made to find users within a 5 mile radius and then text messages are sent to them via twillio that
helpful resources have just been posted). 
Note: Requires jwt auth token

This can take either an address or longitude and latitude coordinates. If an address, it will be convered into long lat and used
for comparison against zip codes of users in the database 

itemType can be food, clothes, or other

/api/userAddItem

{
	"address":"63-25 Main St, Flushing, NY 11367",
	"itemToDonate":{
		"itemType":"food",
		"itemDescription":"free sandwiches"
	}
	
}

OR

{
	"latitude":88,
	"longitude":-70
	"itemToDonate":{
		"itemType":"food",
		"itemDescription":"free sandwiches"
	}
	
}

Returns all the user's added items on success
