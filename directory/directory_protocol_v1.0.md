# Directory Protocol - the DNS-based Identity Record

*author:kodaxx, version: 1.0*

## Abstract
In decentralized systems (especially those that utilize public-key cryptography), a user may wish to use an [internet identifier](https://datatracker.ietf.org/doc/html/rfc5322#section-3.4.1) (an email-like address) instead of a public-key or complex alphanumeric identifier.

This specification will assume that the <user> part will be restricted to the characters `a-z0-9-_`, lowercase.

Upon seeing an internet identifier, the client will resolve it with the domain to retrieve the information that the app requires; this could be user metadata, public keys for message signing, account identifiers, xpub keys for cryptocurrency, or anything else related to a public online identity.

The resolving process is done by splitting the identifier into two parts:

`<user>` and `<domain>`

We will use kodaxx@get-spark.com as an example throughout this document.


## Protocol Discovery (Optional)
In this version of the protocol, reaching out to this file is not required.

As this protocol evolves and more capabilities are added, this file will allow us to discover the different possible endpoints for the services located on this domain. In future versions, this discovery will be the first step in identity resolution.

As of version `1.0`, the directory endpoint will be the same on every service, but it will be considered good practice to have this file anyway.

If the `<domain>` is get-spark.com, we will reach out to the document that is placed in a known location on this web server. This document will be placed in the same location on any DIR service,  `/.well-known/dir.json`

  

(ex:  https://get-spark.com/.well-known/dir.json)

    {
	    "version": "1.0", 
	    "capabilities": "json",
	    "endpoints": {
		"directory": "https://get-spark.com/.well-known/{alias}.json",
	    }
    }

This document will describe the specification version being used, service capabilities, and identity resolution endpoints.

As a reminder, version `1.0` of this specification will specify that users have a JSON file located in ./well-known/<user>.json


## Identity Resolution

As of version `1.0`, the client will use the identifier values to make a GET request to:

    https://<domain>/.well-known/<user>.json

(ex: https://get-spark.com/.well-known/kodaxx.json)

In future versions, endpoints discovered during the protocol discovery stage will receive the request.

The result should be a JSON document containing information related to the user:

    {
	    "metadata": {
		"displayName": "spencer",
		"profilePicture": "https://url.com/profile.jpg"
	    },
	    "dash": "Xs71E43MSiTJPjwssjKoUW8PB6npBNd6Mb"
    }

As of this version, the supported objects and keys are as follows:

A `metadata` object with the following keys
| key | value |
| --- | --- |
| `displayName` | if the user wants to display a name other than their username |
| `profilePicture` | a url pointing to a profile picture |

Other supported keys:
| key | value |
| --- | --- |
| `pubKey` | a public key from a cryptographic keypair that can be used for signing messages |
| `btc` | a base58 BTC address |
| `btcex` | a bitcoin extended public key (xpub key) |
| `dash` | a base58 Dash address |
| `dashex` | a dash extended public key (xpub key) |

## Example
If a client sees an identifier like this: kodaxx@get-spark.com

It will make a GET request to https://get-spark.com/.well-known/kodaxx.json and get back a response that will look like

    {
	    "metadata": {
		"displayName": "spencer",
		"profilePicture": "https://url.com/profile.jpg"
	    },
	    "dash": "Xs71E43MSiTJPjwssjKoUW8PB6npBNd6Mb"
    }

## Notes

### Showing just the domain as an identifier
Clients should treat the identifier `_@domain` as the "root" identifier, and choose to display it as just the `<domain>`.

This is because if kodaxx owns kodaxx.com, they may not want an identifier like kodaxx@kodaxx.com

Instead, kodaxx can use the identifier `_@kodaxx.com` and expect clients to treat that as `kodaxx.com`.

### Why JSON documents?
By using JSON files, we can support both dynamic servers that can generate JSON on-demand and simple static servers hosting one file.

### Allowing access from JavaScript apps
JavaScript apps may be restricted by browser [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) policies that prevent them from accessing `/.well-known/<user>.json` on the host domain.

When CORS prevents the loading of a resource, it can be seen as the resource not existing. This means it isn’t always possible for a client to know that the failure was caused by a CORS issue.

Users should serve their `/.well-known/<user>.json` file with the HTTP header:

    Access-Control-Allow-Origin: *

This will ensure it can be validated by clients running in modern browsers.

### Security Constraints
The `/.well-known/<user>.json` endpoint **MUST NOT** return any HTTP redirects.

Clients **MUST** ignore any HTTP redirects given by the `/.well-known/<user>.json` endpoint.
