import config from "chain/config";
import React from "react";
import {Link} from "react-router";
import connectToStores from "alt/utils/connectToStores";
import accountUtils from "common/account_utils";
import utils from "common/utils";
import Translate from "react-translate-component";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import WalletDb from "stores/WalletDb";
import TranswiserDepositWithdraw from "../DepositWithdraw/transwiser/TranswiserDepositWithdraw";
import BlockTradesBridgeDepositRequest from "../DepositWithdraw/blocktrades/BlockTradesBridgeDepositRequest";
import BlockTradesGatewayDepositRequest from "../DepositWithdraw/blocktrades/BlockTradesGatewayDepositRequest";
import BlockTradesGateway from "../DepositWithdraw/BlockTradesGateway";
import MetaExchange from "../DepositWithdraw/MetaExchange";
import OpenLedgerFiatDepositWithdrawal from "../DepositWithdraw/openledger/OpenLedgerFiatDepositWithdrawal";
import OpenLedgerFiatTransactionHistory from "../DepositWithdraw/openledger/OpenLedgerFiatTransactionHistory";
import Tabs from "../Utility/Tabs";
import HelpContent from "../Utility/HelpContent";
import Post from "common/formPost";
import cnames from "classnames";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";

let olGatewayCoins = require("components/DepositWithdraw/openledger/gatewayCoins.json");

@BindToChainState()
class AccountDepositWithdraw extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        contained: React.PropTypes.bool
    };

    static defaultProps = {
        contained: false
    };

    constructor(props) {
        super();
        this.state = {
            blockTradesCoins: [],
            olService: props.viewSettings.get("olService", "gateway"),
            btService: props.viewSettings.get("btService", "bridge"),
            metaService: props.viewSettings.get("metaService", "bridge")
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.account !== this.props.account ||
            !utils.are_equal_shallow(nextState.blockTradesCoins, this.state.blockTradesCoins) ||
            nextState.olService !== this.state.olService ||
            nextState.btService !== this.state.btService ||
            nextState.metaService !== this.state.metaService
        );
    }

    componentWillMount() {
        accountUtils.getFinalFeeAsset(this.props.account, "transfer");
        fetch("https://blocktrades.us/api/v2/coins").then(reply => reply.json().then(result => {
            this.setState({
                blockTradesCoins: result
            });
        })).catch(err => {
            console.log("error fetching blocktrades list of coins", err);
        });
    }

    toggleOLService(service) {
        this.setState({
            olService: service
        });

        SettingsActions.changeViewSetting({
            olService: service
        });
    }

    toggleBTService(service) {
        this.setState({
            btService: service
        });

        SettingsActions.changeViewSetting({
            btService: service
        });
    }

    toggleMetaService(service) {
        this.setState({
            metaService: service
        });

        SettingsActions.changeViewSetting({
            metaService: service
        });
    }

    render() {
        let {account} = this.props;
        let {olService, btService, metaService} = this.state;

        let blockTradesGatewayCoins = this.state.blockTradesCoins.filter(coin => {
            if (coin.backingCoinType === "muse") {
                return false;
            }
            
            return coin.symbol.toUpperCase().indexOf("TRADE") !== -1;
        })
        .map(coin => {
            return coin;
        });

        return (
		<div className={this.props.contained ? "grid-content" : "grid-container"}>
            <div className={this.props.contained ? "" : "grid-content"}>
                <HelpContent path="components/DepositWithdraw" section="receive" account={account.get("name")}/>
                <HelpContent path="components/DepositWithdraw" section="deposit-short"/>
    			<Tabs
                    setting="depositWithdrawSettingsTab"
                    tabsClass="bordered-header no-padding"
                    defaultActiveTab={config.depositWithdrawDefaultActiveTab}
                    contentClass="grid-content"
                >

                    <Tabs.Tab title="Gateway">
                        <div className="content-block">
                            <div className="float-right">
                                <a href="https://www.ccedk.com/" target="__blank"><Translate content="gateway.website" /></a>
                            </div>
                            {/*
                            <div className="button-group" style={{marginBottom: 0}}>
                                <div onClick={this.toggleOLService.bind(this, "gateway")} className={cnames("button", olService === "gateway" ? "active" : "outline")}><Translate content="gateway.gateway" /></div>
                                <div onClick={this.toggleOLService.bind(this, "fiat")} className={cnames("button", olService === "fiat" ? "active" : "outline")}>Fiat</div>
                            </div>
                            */}
                                
                            {true || olService === "gateway" && blockTradesGatewayCoins.length ? 
                            <BlockTradesGateway
                                account={account}
                                coins={olGatewayCoins}
                                provider="openledger"
                            /> : null}

                            {false && olService === "fiat" ? 
                            <div>
                                <div style={{paddingBottom: 15}}><Translate component="h5" content="gateway.fiat_text" /></div>

                                <OpenLedgerFiatDepositWithdrawal
                                        rpc_url="https://openledger.info/api/"
                                        account={account}
                                        issuer_account="openledger-fiat" />
                                <OpenLedgerFiatTransactionHistory
                                        rpc_url="https://openledger.info/api/"
                                        account={account} />
                            </div> : null}
                        </div>

                        
                    </Tabs.Tab>

                    <Tabs.Tab title="Bridge">
                        <div className="content-block">
                            <div className="float-right"><a href="https://blocktrades.us" target="__blank"><Translate content="gateway.website" /></a></div>
                            {/*<div className="button-group">
                                <div onClick={this.toggleBTService.bind(this, "bridge")} className={cnames("button", btService === "bridge" ? "active" : "outline")}><Translate content="gateway.bridge" /></div>
                                <div onClick={this.toggleBTService.bind(this, "gateway")} className={cnames("button", btService === "gateway" ? "active" : "outline")}><Translate content="gateway.gateway" /></div>
                            </div>
                            */}

                            {true || btService === "bridge" ? 
                            <BlockTradesBridgeDepositRequest
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={account}
                                initial_deposit_input_coin_type="ethereum_mkr"
                                initial_deposit_output_coin_type="bitshares_mkr"
                                initial_deposit_estimated_input_amount="1.0"
                                initial_withdraw_input_coin_type="bitshares_mkr"
                                initial_withdraw_output_coin_type="ethereum_mkr"
                                initial_withdraw_estimated_input_amount="1.0"
                            /> : null}

                            {false && btService === "gateway" && blockTradesGatewayCoins.length ? 
                            <BlockTradesGateway
                                account={account}
                                coins={blockTradesGatewayCoins}
                                provider="blocktrades"
                            /> : null}
                        </div>
                        <div className="content-block">
                            

                        </div>
                    </Tabs.Tab>
                    
                    {/* 
                    <Tabs.Tab title="metaexchange">
                        <div className="float-right"><a style={{textTransform: "capitalize"}} href="https://metaexchange.info" target="__blank"><Translate content="gateway.website" /></a></div>
                        <div className="button-group">
                            <div onClick={this.toggleMetaService.bind(this, "bridge")} className={cnames("button", metaService === "bridge" ? "active" : "outline")}><Translate content="gateway.bridge" /></div>
                            <div onClick={this.toggleMetaService.bind(this, "gateway")} className={cnames("button", metaService === "gateway" ? "active" : "outline")}><Translate content="gateway.gateway" /></div>
                        </div>

                        <MetaExchange
                            account={account}
                            service={metaService}
                        />
                    </Tabs.Tab>
                    */}
                    {/* 
                    <Tabs.Tab title="transwiser">
                        <div className="float-right"><a href="http://www.transwiser.com" target="_blank"><Translate content="gateway.website" /></a></div>
                        <table className="table">
                            <thead>
                            <tr>
                                <th><Translate content="gateway.symbol" /></th>
                                <th><Translate content="gateway.deposit_to" /></th>
                                <th><Translate content="gateway.balance" /></th>
                                <th><Translate content="gateway.withdraw" /></th>
                            </tr>
                            </thead>
                            <tbody>
                            <TranswiserDepositWithdraw
                                issuerAccount="transwiser-wallet"
                                account={account.get('name')}
                                receiveAsset="TCNY" />
                            <TranswiserDepositWithdraw
                                issuerAccount="transwiser-wallet"
                                account={account.get('name')}
                                receiveAsset="CNY" />
                            {/*
                            <TranswiserDepositWithdraw
                                issuerAccount="transwiser-wallet"
                                account={this.props.account.get('name')}
                                receiveAsset="BOTSCNY" />
                            }
                            </tbody>
                        </table>
                    </Tabs.Tab>
                    */}
                </Tabs>
            </div>
		</div>
        )
    }
};

@connectToStores
export default class DepositStoreWrapper extends React.Component {
    static getStores() {
        return [AccountStore, SettingsStore]
    };

    static getPropsFromStores() {
        return {
            account: AccountStore.getState().currentAccount,
            viewSettings: SettingsStore.getState().viewSettings
        }
    };

    render () {
        return <AccountDepositWithdraw {...this.props}/>
    }
}
