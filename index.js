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
import { dataBridgeETHToStarknetAmount } from 'tools-d4rk444/bridge.js';
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
        console.log(err);
        logger.log(err);
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
        'Get Starknet Address',
    ];

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
            await getStarknetAddress(walletSTARK[i]);
        }
        
        await timeout(pauseWalletTime);
    }
    console.log(chalk.bgMagentaBright('Process End!'));
    logger.log('Process End!');
})();