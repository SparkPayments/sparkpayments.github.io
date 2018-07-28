var spark = {
  utils: {

    getExchangeRate: function(token, currency) {
      return new Promise(resolve => {
        if (currency.match( /ARS|AUD|BRL|CAD|DKK|AED|EUR|HKD|INR|ILS|KES|MXN|NZD|NOK|PHP|PLN|GBP|SGD|SEK|CHF|USD|JPY|CNY/g ) !== null) {
          spark.utils.ajax(`http://anyorigin.com/go?url=https%3A//api.uphold.com/v0/ticker/${currency}`)
            .then(function(result) {
              console.log(result);
              resolve(result[11]);
            })
            .catch(function(e) {
              console.log(`error: ${e}`);
            });
        } else {
          spark.utils.ajax(`https://min-api.cryptocompare.com/data/price?fsym=${token}&tsyms=${currency}`)
            .then(function(result) {
              console.log(result);
              resolve(result[currency]);
            })
            .catch(function(e) {
              console.log(`error: ${e}`);
            });
        }
      });
    },

    getAddress: function(account) {
      return new Promise(resolve => {
        if (account.startsWith('xpub')) {
          console.log('xpub coming soon.')
          swal("Sorry", "XPUB coming soon :(", "error");
        } else {
          resolve(account);
        }
      });
    },

    latestTx: function(url) {
      return new Promise(resolve => {
        spark.utils.ajax(url)
          .then(function(result) {
            console.log(result);
            let id = '0';
            if (result.txs.length > 0) {
              id = result.txs[0].txid;
            }
            console.log(id);
            resolve(id);
          })
          .catch(function(e) {
            console.log(`error: ${e}`);
          });
      });
    },

    verify: function(url, initial, price) {
      return new Promise(resolve => {
        spark.utils.ajax(url)
          .then(function(result) {
            let status = false;
            let latest = '0';
            let found = 0;
            let expected = parseFloat(price).toFixed(8);
            if (result.txs.length > 0) {
              latest = result.txs[0].txid;
              if (latest != initial) {
                app.$data.locked = result.txs[0].txlock;
                result.txs[0].vout.forEach(function(output) {
                  if (output.scriptPubKey.addresses[0] === app.$data.address) {
                    found = output.value;
                    app.$data.price.received = found;
                  }
                });
              }
            }
            console.log(result);
            console.log(`expected amount: ${expected}`);
            console.log(`found amount: ${found}`);
            if (latest != initial && found >= expected && expected != 0) {
              status = true;
            }
            resolve(status);
          })
          .catch(function(e) {
            console.log(`error: ${e}`);
          });
      });
    },

    ajax: function(url) {
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
          resolve(JSON.parse(this.responseText));
        };
        xhr.onerror = reject;
        xhr.open('GET', url);
        xhr.send();
      });
    }

  }
};
