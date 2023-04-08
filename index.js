import { rpc, chainContract, timeout, shuffle, parseFile, generateRandomAmount } from 'tools-d4rk444/other.js';
import { sendEVMTX,
    deployStarknetWallet,
    privateToStarknetAddress,
    getAmountTokenStark,
    sendTransactionStarknet,
    getGasPriceEthereum,
    getETHAmount,
    privateToAddress,
    estimateInvokeMaxFee,
    estimateMsgFee } from 'tools-d4rk444/web3.js';
import { dataBridgeETHToStarknetAmount, dataBridgeETHFromStarknet, dataWithdrawFromBridge } from 'tools-d4rk444/bridge.js';
import { subtract, multiply, divide, add } from 'mathjs';
import fs from 'fs';
import readline from 'readline-sync';
import consoleStamp from 'console-stamp';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
dotenv.config();

const output = fs.createWriteStream(`history.log`, { flags: 'a' });
const logger = new console.Console(output);
consoleStamp(console, { format: ':date(HH:MM:ss)' });
consoleStamp(logger, { format: ':date(yyyy/mm/dd HH:MM:ss)', stdout: output });

const pauseTime = generateRandomAmount(process.env.TIMEOUT_ACTION_SEC_MIN * 1000, process.env.TIMEOUT_ACTION_SEC_MAX * 1000, 0);
const pauseWalletTime = generateRandomAmount(process.env.TIMEOUT_WALLET_SEC_MIN * 1000, process.env.TIMEOUT_WALLET_SEC_MAX * 1000, 0);

const bridgeETHToStarknet = async(privateKeyEthereum, privateKeyStarknet) => {
    const addressEthereum = privateToAddress(privateKeyEthereum);
    const addressStarknet = await privateToStarknetAddress(privateKeyStarknet);
    const amountETH = generateRandomAmount(process.env.ETH_BRIDGE_MIN * 10**18, process.env.ETH_BRIDGE_MAX * 10**18, 0);

    await getETHAmount(rpc.Ethereum, addressEthereum).then((res) => {
        if (Number(res) < amountETH) {
            console.log(chalk.red('Not enough ETH'));
            logger.log('Not enough ETH');
        };
    });

    //BRIDGE ETH TO STARKNET
    console.log(chalk.yellow(`Bridge ${amountETH / 10**18}ETH to Starknet`));
    logger.log(`Bridge ${amountETH / 10**18}ETH to Starknet`);
    try {
        await estimateMsgFee(addressStarknet, amountETH.toString()).then(async(msgFee) => {
            const value = add(amountETH, msgFee);
            await dataBridgeETHToStarknetAmount(rpc.Ethereum, amountETH, value, addressStarknet, addressEthereum).then(async(res) => {     
                await getGasPriceEthereum().then(async(fee) => {
                    await sendEVMTX(rpc.Ethereum,
                        2,
                        res.estimateGas,
                        '0',
                        (parseInt(multiply(fee.maxFee, 1.15))).toString(),
                        fee.maxPriorityFee,
                        chainContract.Ethereum.StarknetBridge,
                        value,
                        res.encodeABI,
                        privateKeyEthereum);
                });
            });
        });
        await timeout(pauseTime);
    } catch (err) {
        logger.log(err.data.message);
        throw new Error(err.data.message);
    }
}

const bridgeETHFromStarknet = async(privateKeyEthereum, privateKeyStarknet) => {
    const addressEthereum = privateToAddress(privateKeyEthereum);
    const addressStarknet = await privateToStarknetAddress(privateKeyStarknet);
    let isReady;

    while(!isReady) {
        console.log(chalk.yellow(`Bridge ETH to Ethereum`));
        logger.log(`Bridge ETH to Ethereum`);
        await getAmountTokenStark(addressStarknet, chainContract.Starknet.ETH, chainContract.Starknet.ETHAbi).then(async (res) => {
            if (Number(res) < 0.001 * 10**18) { 
                console.log(chalk.red('Not enough ETH'));
                logger.log('Not enough ETH');
            };

            await dataBridgeETHFromStarknet(addressEthereum, 1).then(async(payload) => {
                await estimateInvokeMaxFee(payload, privateKeyStarknet).then(async(maxFee) => {
                    const randomAmount = generateRandomAmount(2 * 10**12, 5 * 10**12, 0);
                    const amountETH = subtract( subtract(res, maxFee), randomAmount);
                    payload = await dataBridgeETHFromStarknet(addressEthereum, amountETH);
                    try {
                        await sendTransactionStarknet(payload, privateKeyStarknet);
                        fs.writeFileSync("amountBridge.txt", `${amountETH}\n`, { flag: 'a+' });
                        isReady = true;
                        await timeout(pauseTime);
                    } catch (err) {
                        logger.log(err.data.message);
                        throw new Error(err.data.message);
                    };
                });
            });
        });
    }
}

const withdrawETHFromBridge = async(amountETH, privateKeyEthereum) => {
    const addressEthereum = privateToAddress(privateKeyEthereum);

    console.log(chalk.yellow(`Withdraw ${amountETH / 10**18}ETH from Stargate`));
    logger.log(`Withdraw ${amountETH / 10**18}ETH from Stargate`);
    try {
        await dataWithdrawFromBridge(rpc.Ethereum, amountETH, addressEthereum).then(async(res) => {
            await getGasPriceEthereum().then(async(fee) => {
                await sendEVMTX(rpc.Ethereum,
                    2,
                    res.estimateGas,
                    '0',
                    (parseInt(multiply(fee.maxFee, 1.15))).toString(),
                    fee.maxPriorityFee,
                    chainContract.Ethereum.StarknetBridge,
                    null,
                    res.encodeABI,
                    privateKeyEthereum);
            });
        });
        await timeout(pauseTime);
    } catch (err) {
        logger.log(err.data.message);
        throw new Error(err.data.message);
    }
}

const getStarknetAddress = async(privateKeyStarknet) => {
    const address = await privateToStarknetAddress(privateKeyStarknet);
    console.log(`Address: ${address}`);
}

(async() => {
    const walletETH = parseFile('privateETH.txt');
    const walletSTARK = parseFile('privateArgent.txt');
    const stage = [
        'Bridge to Starknet',
        'Deploy Account',
        'Bridge to Ethereum',
        'Withdraw ETH from Starkgate',
        'Get Starknet Address',
    ];
    
    console.log(chalk.magenta('Created by @d4rk444'));
    const index = readline.keyInSelect(stage, 'Choose stage!');
    if (index == -1) { process.exit() };
    console.log(chalk.green(`Start ${stage[index]}`));
    logger.log(`Start ${stage[index]}`);

    for (let i = 0; i < walletETH.length; i++) {
        try {
            console.log(chalk.blue(`Wallet ${i+1} Wallet ETH: ${privateToAddress(walletETH[i])}, Wallet Starknet: ${await privateToStarknetAddress(walletSTARK[i])}`));
            logger.log(`Wallet ${i+1} Wallet ETH: ${privateToAddress(walletETH[i])}, Wallet Starknet: ${await privateToStarknetAddress(walletSTARK[i])}`);
        } catch (err) {
            throw new Error('Error: Add Private Keys!');
        };

        if (stage[index] == stage[0]) {
            await bridgeETHToStarknet(walletETH[i], walletSTARK[i]);
        } else if (stage[index] == stage[1]) {
            await deployStarknetWallet(walletSTARK[i]);
        } else if (stage[index] == stage[2]) {
            await bridgeETHFromStarknet(walletETH[i], walletSTARK[i]);
        } else if (stage[index] == stage[2]) {
            const amountBridge = parseFile('amountBridge.txt');
            await withdrawETHFromBridge(amountBridge[i], walletETH[i]);
        } else if (stage[index] == stage[2]) {
            await getStarknetAddress(walletSTARK[i]);
        }
        
        await timeout(pauseWalletTime);
    }
    console.log(chalk.bgMagentaBright('Process End!'));
    logger.log('Process End!');
})();