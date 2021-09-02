const __supply = 10 * 10 ** 12;
const __decimals = 10 ** 9;

function comma(value) {
    return String(value).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function fixed3(value) {
    return comma(value.toFixed(3));
}

Vue.filter("fixed3", function (value) {
    return fixed3(value);
});

Vue.filter("comma", function (value) {
    return comma(value);
});

var app = new Vue({
    el: '#app',
    data: {
        address: false,
        hasWallet: false,
        provider: false,
        contract: false,
        signer: false,
        balance: 0,
        totalFees: 0,
        symbol: 'APE-X',
        stats: {
            price: 0,
            mcap: 0,
            supply: __supply,
            holders: 0,
        }
    },
    mounted: function async() {
        if (window.ethereum) {
            this.hasWallet = true;
        }
        this.refresh();
    },
    computed: {
        apy: function () {
            return (this.stats.volume / this.stats.price * 0.04 * (this.balance / __supply));
            // converted_volume(usd)/price(usd)*0.04*pool percentage(accountBalance/10T)
        },
        circulating_supplies: function () {
            return __supply - this.burnt_supplies;
        },
        burnt_supplies: function () {
            return this.totalFees * 0.45 / 2;
        },
        liquidity_fees: function () {
            return this.totalFees * 0.55;
        },
        market_cap: function () {
            return this.circulating_supplies * this.stats.price;
        }
    },
    methods: {
        refresh: async function () {
            if (this.contract) {
                await this.get_balance();
                await this.get_totalfees();
            }
            $.get('ticker.json', function (r) {
                console.log(r);
                t = r.tickers[0];
                app.stats = {
                    price: t.converted_last.usd,
                    mcap: 0, //__supply * t.converted_last.usd,
                    supply: __supply,
                    holders: r.token_holder_count,
                    volume: t.converted_volume.usd,
                }
            });
        },
        connect_wallet: function () {
            window.ethereum.enable().then(function () {
                app.provider = new ethers.providers.Web3Provider(window.ethereum);
                app.signer = app.provider.getSigner(); const abi = [
                    // Read-Only Functions
                    "function balanceOf(address owner) view returns (uint256)",
                    "function decimals() view returns (uint8)",
                    "function symbol() view returns (string)",
                    "function totalFees() view returns (uint256)"
                ];
                app.contract = new ethers.Contract('0xd039C9079ca7F2a87D632A9C0d7cEa0137bAcFB5', abi, app.signer);
                app.provider.listAccounts().then(function (acc) {
                    if (acc[0]) {
                        app.address = acc[0];
                        console.log(app.address);
                        app.get_balance();
                        app.get_totalfees();
                    }
                    else {
                        app.address = '';
                    }
                });
            });
        },

        get_balance: function () {
            app.contract.balanceOf(this.address).then(function (bal) {
                console.log(bal);
                app.balance = bal.toString() / __decimals;
            });
        },

        get_totalfees: function () {
            app.contract.totalFees().then(function (fee) {
                console.log(fee);
                app.totalFees = fee.toString() / __decimals;
            });
        }
    }
});

$(function () {
    window.setInterval(app.refresh, 30000);
});