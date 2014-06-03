# Restesque planning

# Service 

## [Set] rest:services

$service should be stored in a set.

##  [String] rest:dservice:$service

$data should be stored in a key

### Get All children in a service

    SMEMBERS rest:services

### query a service exists

    SISMEMBER rest:services $service

### add a service

    SADD rest:services $service
    SET rest:dservice:$service $data
    
### remove a service

    SREM rest:services $service
    DEL rest:dservice:$service

### update a service
 
    SET rest:dservice:$service $data
 
# Ids

## [Set] rest:ids

$id should be stored in a set.

##  [String] rest:did:$service:$id

$data should be stored in a string

# Keys

## [Set] rest:keys

$key should be stored in a set.

##  [String] rest:dkey:$service:$id:$key

$data should be stored in a string

# Numbers

##  [String] rest:dnumber:$service:$id:$key

$number should be stored in a string


