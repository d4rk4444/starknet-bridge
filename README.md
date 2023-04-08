# starknet-bridge
Скрипт для моста Starkgate в сеть Starknet и обратно.

## Описание
Описание всех функций скрипта      

1. Мост с Ethereum в Starknet [*Использует Starkgate и текущий gasPriceMax в сети*]   
2. Deploy нового аккаунта [*Использует немного ETH*]
3. Мост с Starknet в Ethereum [*Использует Starkgate*]
4. Клейм ETH в Starkgate [*Записывает сумму ETH в файл amountBridge.txt*]
5. Выводит ваш Starknet адрес [*Берет сумму с файла amountBridge.txt*] **Удалите этот файл после использования функции!!!**
0. Отмена
    
## Установка
```
git clone https://github.com/d4rk4444/starknet-bridge.git
cd starknet-bridge
npm i
```

## Настройка
Все нужные настройки в файле .env    

1. Время для паузы между действиями        
2. Время для паузы между кошельками       
3. Количество ETH для моста в сеть Starknet        

В файл privateArgnet.txt вставляете приватные адреса с ArgentX в таком формате:     
```
ключ1
ключ2
```
          
В файл privateETH.txt вставляете приватные адреса с Metamask в таком формате:    
```
ключ1
ключ2
```
## Запуск
```
node index
```

*Created by d4rk444 Telegram @d4rk444. Writing scripts to automate blockchain actions*