# Routes

A realtime current number data store 	.

Using the following normalized URL/data structure.

    /:service/:id/:key/number/
    
Each path component (aside from) number have meta data associated with it. 

The intail intention is only to store the current value but allow other services to hook in (subscribe) to perform other tasks. For example another service may store results over the course of a day.

## Implementation / Adapter

Initail prototype may use memory.
DB: Metadata to be stored in MongoDB and/or Redis. Paths and values to be stored in redis.

## Permissions

@Todo. Each path should have some form of protection. Perhaps:  

+ Read list
+ Write keys list
+ Delete keys list
+ Subscribe keys list

so that a basic form of authtication may be put in place. 

_Optionally_ perhaps there a configure and/or server routes which has these in place. For example:

	GET /server/stats/memory
	/permissions/:service/readkeys
	/permissions/:service/writekeys
	/permissions/:service/id_writekeys
	/permissions/:service/id_readkeys

    
## Statrace
    
In statrace terms this would mean

## Example 1:

     GET /twitter/rossc1/followers/number
     PUT /twitter/rossc1/followers/number/?increment
     PUT /twitter/rossc1/followers/number/?decrement
     SUBSCRIBE /twitter/rossc1/followers/number

## Example 2:

     INCREMENT /running/rossc1/total/
     POST /running/rossc1/miles/number?add
     PUT/running/rossc1/runs/number?add

## Example 3:

     INCREMENT /kickstarter/washing/total/
     ADD /kickstarter/washing/miles/
     DECREMENT/kickstarter/washing/runs/
     SUBSCRIBE /kickstarter/washing/runs/
     


## Request types

### `/`

#### Method GET with ?children
Returns a list of services

### `/:service/`

#### Method GET 
Returns meta json associated with service

#### Method GET  with ?children
Returns a list of all ids

#### Method POST
Creates a new service if one does not already exist. 

If there is body data it will be set as the meta data associated with service.

_Sending a POST request with body data will overwite meta data if the route already exsists. A __safer__ method would be to first POST the service then PUT the body data later. This means apps associated with a service can always call POST when they start up._

__Request__  

     {
		"resource" : "/<service>/",
		"method" : "POST",
		"body" : { "meta" : { "chips" : "fish"} }
     }
 
__Responce__  
    
    {
   		"resource" : "/<service>/",
		"status" : "ok",
		"body" : {
			"exists :"true",
			"meta" : { "chips" : "fish"} 
	    }
    }

#### Method PUT
Updates meta data associated with service

Does not create data if method does not exits.


#### Method DELETE
Removes a service

####  (Websocket only) Method SUBSCRIBE
Subscribes to changes in the :id meta data

####  (Websocket only) Method UNSUBSCRIBE
Unsubscribes to changes in the :id meta data

### `/:service/:id/`

#### Method GET 
Returns meta json associated with an :id

#### Method GET with ?children
Returns an array of values

#### Method POST 
Creates a new service with meta json  associated with :id

#### Method PUT
Updates meta json associated with :id


#### Method DELETE
Removes an :id

#### (Websocket only) Method SUBSCRIBE
Subscribes to changes in the :id meta data

#### (Websocket only) Method UNSUBSCRIBE
Unsubscribes to changes in the :id meta data

### `/:service/:id/:key/`

#### GET 
Returns meta json associated with an :id

#### POST
Creates a new service with meta json  associated with :id

#### PUT
Updates meta json associated with :id

#### DELETE
Removes an :id

#### (Websocket only) SUBSCRIBE
Subscribe to changes in the :key meta data

#### (Websocket only) UNSUBSCRIBE
Unsubscribe to changes in the :key meta data

### `/:service/:id/:key/number`

#### GET
Returns the number

#### POST
Sets the inital number to the body of the request

#### PUT|GET ?increment
Adds 1 to the number

#### PUT|GET ?decrement
Subtracts 1 from the number

#### PUT|GET ?add
Adds the body of the request to the number

#### PUT|GET ?subtract
Subtracts the body of the request to the number

## Questions
How do you query if something exists? GET?  
Is meta data always replaced?  
