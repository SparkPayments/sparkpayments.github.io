/*jslint browser: true*/
/*global $, spark, navigation, window, document*/

//if device goes offline, show connection page
window.addEventListener('offline', function() {
  app.$data.route = 'connection';
});
//if device comes online, show connection page
window.addEventListener('online', function() {
  app.$data.route = 'home';
});
//add listener for android back button
document.addEventListener("backbutton", onBackKeyDown, false);
//back key event handler
function onBackKeyDown(e) {
  e.preventDefault();
  app.cancel()
  app.$data.route = 'home';
}

var app = new Vue({
  el: '#app',
  data: {
    route: 'home',
    price: {
      native: '',
      dash: '0',
      mdash: '0',
      received: '0'
    },
    settings: {
      account: localStorage.getItem('account'),
      currency: localStorage.getItem('currency') || 'USD',
      format: localStorage.getItem('format') || 'dash'
    },
    address: '',
    initial: 0,
    recent: '',
    locked: false
  },
  computed: {
    amountInput: function() {
      if (this.settings.currency.match( /BYN|CLP|ISK|JPY|KRW|PYG|UGX|UYU|VND/g ) !== null) {
        //these currencies have no decimals
        return this.price.native || 0;
      } else if (this.settings.currency.match( /BHD|KWD|OMR/g ) !== null) {
        //these currencies have 3 decimals
        return parseFloat(this.price.native / 100).toFixed(3) || 0;
      } else {
        //these currencies have 2 decimals
        return parseFloat(this.price.native / 100).toFixed(2) || 0;
      }
    }
  },
  methods: {
    //clear usd price, steem price, and memo
    clear: function() {
      this.price.native = '';
      this.price.dash = '0';
      this.price.mdash = '0';
      this.price.received = '0';
      this.address = '';
    },
    //adds pressed key to amount display
    add: function(num) {
      this.price.native = this.price.native + num;
    },
    remove: function() {
      this.price.native = this.price.native.slice(0, -1);
    },
    //begins purchase
    purchase: async function() {
      //if amount is empty, notify merchant and stop function
      if (this.price.native === '' || this.price.native == 0) {
        swal("Error!", "Price cannot be blank. Please enter an amount.", "error");
        return;
      }
      //show loading screen
      this.route = 'loader'
      //get current price
      this.price.dash = `${(this.amountInput / parseFloat(await spark.utils.getExchangeRate('DASH', this.settings.currency))).toFixed(8)} DASH`;
      //set pice in mdash
      this.price.mdash = `${(parseFloat(this.price.dash) * 1000).toFixed(5)} mDash`;
      //get new address for handle
      this.address = await spark.utils.getAddress(this.settings.account);
      //generate QR code with dash URL and price
      let qr = new QRious({
        element: document.getElementById('qr'),
        backgroundAlpha: 0,
        foregroundAlpha: 0.8,
        level: 'H',
        padding: 15,
        size: 256,
        value: `dash:${this.address}?amount=${parseFloat(this.price.dash)}&is=1`
      });

      let seconds = 0;
      //set timer for 120 seconds
      let timer = setInterval(function() {
        if (seconds >= 120) {
          seconds = 0;
        }
        seconds += 1;
        document.getElementById('waiting').value = seconds;
      }, 1000);
      //set block explorer URL
      let url;
      //if testnet address, use testnet explorer
      if (this.address.startsWith('y')) {
        url = `https://testnet-insight.dashevo.org/insight-api-dash/txs/?address=${this.address}`;
      } else {
        url = `https://insight.dash.org/insight-api-dash/txs/?address=${this.address}`;
      }

      //get initial address balance
      this.initial = await spark.utils.latestTx(url);
      //query block explorer every 5 seconds
      let verify = setInterval(async function() {
        //if price is 0, stop checking block explorer
        if (parseFloat(app.$data.price.dash) == 0) {
          clearInterval(verify);
          clearInterval(timer);
          clearTimeout(timeout);
        }
        //if block explorer query function returns true
        if (await spark.utils.verify(url, app.$data.initial, parseFloat(app.$data.price.dash))) {
          console.log('transaction found');
          //play kaching sound effect
          document.getElementById("kaching").play();
          //show confirm page
          app.$data.route = 'confirmed';
          //stop checking block explorer
          clearInterval(verify);
          //stop payment timer
          clearInterval(timer);
          //clear timout screen
          clearTimeout(timeout);
          //clear prices and address
          app.clear();
        }
      }, 5000);

      //wait 120 seconds after starting payment todo: rework this part
      let timeout = setTimeout(function() {
        console.log('stopping');
        //stop checking block explorer
        clearInterval(verify);
        //stop timer
        clearInterval(timer);
        //clear prices, address
        app.clear();
        //show timeout page
        app.$data.route = 'timeout';
      }, 120000);

      //show NFC page after we start listening
      this.route = 'qr';
    },
    cancel: function() {
      //clear prices, memo, and return home
      this.clear();
      this.route = 'home';
    },
    //saves input value to local storage and return home
    save: async function() {
      if (this.settings.account.startsWith('dash')) {
        this.settings.account = this.settings.account.split(':')[1];
      }
      localStorage.setItem('account', this.settings.account);
      localStorage.setItem('currency', this.settings.currency);
      localStorage.setItem('format', this.settings.format);
      this.route = 'home';
    },
    //temp function for coming soon sweetalert
    soon: function() {
      swal("Sorry", "Feature coming soon :(", "error");
    }
  },
  //when vue instance is created (app is started), do these things
  async created() {
    //if device is offline, show connection page
    if (!navigator.onLine) {
      this.route = 'connection';
    }
    if (!localStorage.getItem('account')) {
      this.route = 'settings';
    }
  }
});
