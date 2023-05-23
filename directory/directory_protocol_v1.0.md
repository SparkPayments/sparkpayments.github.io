# Directory Protocol - the DNS-based Identity Record

*author: kodaxx, version: 1.0-draft*

*references: w3c did spec, nostr nip-05 (fiatjaf, mikedilger), nano internet identifiers (atxmj, keeri, fosse), RFC-5322*

## Abstract
In decentralized systems (especially those that utilize public-key cryptography), a user may wish to use an [internet identifier](https://datatracker.ietf.org/doc/html/rfc5322#section-3.4.1) (an email-like address) instead of a public-key or complex alphanumeric identifier.

This specification will assume that the <user> part will be restricted to the characters `a-z0-9-_`, lowercase.

Upon seeing an internet identifier, the client will resolve it with the domain to retrieve the information that the app requires; this could be user metadata, public keys for message signing, addresses for cryptocurrency, or anything else related to a public online identity.

The resolving process is done by splitting the identifier into two parts:

`<user>` and `<domain>`

example:

user@domain.com

user: user

domain: domain.com


## Protocol Discovery (Optional)
In this version of the protocol, having this JSON object in the response is not required.

As this protocol evolves and more capabilities are added, this object could allow us to discover the different possible endpoints for the services located on this domain. In future versions, this discovery should be the first step in identity resolution.

As of version `1.0`, there will be only one service endpoint, but it will be considered good practice to have this in the file anyway.

    {
      protocol: {
        "version": "1.0", 
    	"services": "btc dash nano nostr",
      }
    }

This document will describe the specification version being used and service capabilities.

As a reminder, version `1.0` of this specification will not require the response to contain this data object.


## Identity Resolution

### Request
As of version `1.0`, the client will use the identifier values to make a GET request to:

    https://<domain>/.well-known/dir.json?name=<user>&service=<service>

The URL parameters further narrow the results of the response:
| param | purpose | required |
| --- | --- | --- |
| `name` | the `<user>` portion of identifier | yes |
| `service` | the `<service>` needed. this will return only results for that service | optional |

_note: params to narrow search results will only narrow results if the response is dynamically generated._

The result should be a JSON document containing information related to the user:

    {
      names:[
        "<user>": {
          "metadata": {
            "display": "<display-name>",
            "avatar": "<url>"
          },
          "<service>": {
            "<key>": "<value",
            ...
          },
          ...
        }
      ]
    }

<br>

## Supported Keys, Objects, Services
As of this version, the supported objects and services are as follows:

### Global (to the user)
| key | value |
| --- | --- |
| `remote` | an optional key that contains a url pointing to a remotely hosted identity record |

The `remote` key is reqired if the identity record is otherwise empty.

Likewise, if the `remote` key is used, everything else in this identity record should be empty and will be ignored.

The purpose of this key is for a user to have the ability to use a hosted username service, but to host the identity themselves on a service like GitHub or any similar static file host.

<br>

### User Objects
#### A required `metadata` object with the following keys
| key | value |
| --- | --- |
| `display` | if the user wants to display a name other than their username. this can default to be the same as `<user>` but should not be empty |
| `avatar` | a url pointing to a profile picture |

example:

    {
      names:[
        "kodaxx": {
          "metadata": {
            "display": "spencer",
            "avatar": "https://url.com/pic.jpg"
          }
        }
      ]
    }

<br>

### Service Objects (listed in alphabetical order)
#### A `btc` object with the following keys
| key | value |
| --- | --- |
| `address` | a base58 BTC address |
| `lnurl` | a lighting network URL |

<br>

#### A `dash` object with the following keys
| key | value |
| --- | --- |
| `address` | a base58 Dash address |

<br>

#### A `nano` object with the following keys
| key | value |
| --- | --- |
| `address` | a nano address |
| `expires` | a unix timestamp after which the address is no longer considered valid |

<br>

#### A `nostr` object with the following keys
| key | value |
| --- | --- |
| `pubKey` | a nostr public key identity |
| `relays` | an optional array of relays (ex. ["wss://relay.example.com", ...] ) |

## Example
If a client sees an identifier like this: kodaxx@get-spark.com

It will make a GET request to https://get-spark.com/.well-known/dir.json?name=kodaxx&service=btc and get back a response that will look like

    {
      names:[
        "kodaxx": {
          "metadata": {
            "display": "spencer",
            "avatar": "https://url.com/pic.jpg"
          },
          "btc": {
            "address": asdfasdfads,
          }
        }
      ]
    }

## Notes

### Showing just the domain as an identifier
Clients should treat the identifier `_@domain` as the "root" identifier, and choose to display it as just the `<domain>`.

This is because if bob owns bob.com, they may not want an identifier like bob@bob.com

Instead, kodaxx can use the identifier `_@bob.com` and expect clients to treat that as `bob.com`.

### Why JSON documents?
By using JSON files, we can support both dynamic servers that can generate JSON dynamically, as well as simple static servers hosting one file.

### Allowing access from JavaScript apps
JavaScript apps may be restricted by browser [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) policies that prevent them from accessing `/.well-known/<user>.json` on the host domain.

When CORS prevents the loading of a resource, it can be seen as the resource not existing. This means it isn’t always possible for a client to know that the failure was caused by a CORS issue.

Users should serve their `/.well-known/<user>.json` file with the HTTP header:

    Access-Control-Allow-Origin: *

This will ensure it can be validated by clients running in modern browsers.

### Security Constraints
The `/.well-known/<user>.json` endpoint **MUST NOT** return any HTTP redirects.

Clients **MUST** ignore any HTTP redirects given by the `/.well-known/<user>.json` endpoint.
