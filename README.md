# starknet-bridge
Скрипт для моста Stargate в сеть Starknet.

## Описание
Описание всех функций скрипта      

1. Мост с Mainet в Starknet [*Использует Starkgate и текущий gasPrice в сети*]   
2. Deploy нового аккаунта [*Использует немного ETH*]
3. Выводит ваш Starknet адрес
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