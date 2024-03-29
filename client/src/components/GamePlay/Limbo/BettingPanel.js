import React, { useState, useEffect, useContext } from "react";
import { StoreContext } from "../../../store";
import useGameStore from "../../../GameStore";
import { Box, FormControl } from '@mui/material';
import { Button } from "@mui/material";
import axios from "axios";

import './limbo.css'
import eth from '../../../assets/images/eth.png'
import gem from '../../../assets/images/gem.png'
import nugget from '../../../assets/images/nugget.png'



const LimboPanel = (props) => {
    const { launch, setLaunch, success, setSuccess } = props;
    const global = useContext(StoreContext)
    const { gameHistory, setGameHistory } = useGameStore();
    const { nugAmount, bonusNugAmount, gemAmount, limboWord, diceWord } = useGameStore();
    const { setNugAmount, setBonusNugAmount, setGemAmount, setLimboWord, setDiceWord } = useGameStore();
    const { currencyMode, setAlerts } = useGameStore();
    const { gameMode } = useGameStore();
    const [coinImage, setCoinImage] = useState('');


    useEffect(() => {
        if (currencyMode === 'mainNug') {
            setCoinImage(eth)
        } else if (currencyMode === 'bonusNug') {
            setCoinImage(nugget)
        } else {
            setCoinImage(gem)
        }
    }, [currencyMode])

    const inputAmount = (e) => {
        global.setDepositAmount(parseFloat(parseFloat(e.target.value).toFixed(4)));

    }

    const inputValue = (e) => {
        global.setPayout(parseFloat(parseFloat(e.target.value).toFixed(4)));
        let tempPercent = 99 / (parseFloat(e.target.value));
        if (e.target.value === '') {
            global.setPercent(0);
        } else
            global.setPercent(tempPercent.toFixed(2));
    }

    console.log("gemAmount", gemAmount)

    const clickBet = async () => {
        console.log("in", global.depositAmount)
        global.setStart(true);
        if (!global.walletAddress) {
            setAlerts({
                type: "error",
                content: 'Please connect your wallet!'
            })
            return
        }

        if (!global.depositAmount || !global.payout) {
            setAlerts({
                type: "error",
                content: 'Please fill input field!'
            })
            return
        }

        let amount = gemAmount
        if(currencyMode === "mainNug") {
            amount = nugAmount
        } else if (currencyMode === "bonusNug") {
            amount = bonusNugAmount
        }
        if (parseFloat(global.depositAmount) > amount) {
            console.log("out")
            return
        }
        setLaunch(true);
        let object = {
            amount: parseFloat(global.depositAmount),
            currencyMode: currencyMode,
            payout: global.payout,
            walletAddress: global.walletAddress,
        }

        console.log("currencyMode", currencyMode)

        try {
            console.log('gameMode', gameMode)
            if (gameMode === "limbo") {
                await axios
                    .post(`${process.env.REACT_APP_BACKEND_URL}/api/play/limboDeposit`, object)
                    .then((res) => {
                        if (res.data.status) {
                            console.log("limbo", res.data.content.limboWord)
                            setLimboWord(res.data.content.limboWord)
                            if (currencyMode === "mainNug") {
                                setNugAmount(res.data.content.playAmount)
                            } else if (currencyMode === "bonusNug") {
                                setBonusNugAmount(res.data.content.playAmount)
                            } else {
                                setGemAmount(res.data.content.playAmount)
                            }

                            let history = [...global.limboHistory];
                            history.unshift(
                                <Box className={parseFloat(global.payout) > parseFloat(res.data.content.limboWord) ? "fail card" : "doubled card"}>
                                    x{res.data.content.limboWord}
                                </Box>
                            )

                            if (parseFloat(global.payout) > parseFloat(res.data.content.limboWord)) {
                                setSuccess(true)
                            } else {
                                setSuccess(false)

                            }

                            global.setLimboHistory(history);

                            setTimeout(() => {
                                setLaunch(false);
                            }, 800)

                        } else {
                            setTimeout(() => {
                                setLaunch(false);
                            }, 800)
                            console.log("Error in play limbo", res.data.content)
                        }
                    });
            } else if (gameMode === "dice") {
                object = {
                    amount: parseFloat(global.depositAmount),
                    currencyMode: currencyMode,
                    payout: global.payout,
                    percent: global.percent,
                    walletAddress: global.walletAddress,
                }
                console.log("diceWord clicked")
                await axios
                    .post(`${process.env.REACT_APP_BACKEND_URL}/api/play/diceDeposit`, object)
                    .then((res) => {
                        if (res.data.status) {
                            console.log("diceWord", res.data.content)
                            setDiceWord(res.data.content.diceWord)
                            if (currencyMode === "mainNug") {
                                setNugAmount(res.data.content.playAmount)
                            } else if (currencyMode === "bonusNug") {
                                setBonusNugAmount(res.data.content.playAmount)
                            } else {
                                setGemAmount(res.data.content.playAmount)
                            }

                            let history = [...global.diceHistory];
                            history.unshift(
                                <Box className={parseFloat(global.percent) < parseFloat(res.data.content.diceWord) ? "fail card" : "doubled card"}>
                                    {res.data.content.diceWord}
                                </Box>
                            )

                            if (parseFloat(global.percent) > parseFloat(res.data.content.diceWord)) {
                                setSuccess(true)
                            } else {
                                setSuccess(false)

                            }

                            global.setDiceHistory(history);

                            setTimeout(() => {
                                setLaunch(false);
                            }, 800)

                        } else {
                            setTimeout(() => {
                                setLaunch(false);
                            }, 800)
                            console.log("Error in play dice", res.data.content)
                        }
                    });
            }
            getHistory();
        } catch (err) {
            setTimeout(() => {
                setLaunch(false);
            }, 800)
            console.log("Error while getting hackerList: ", err);
            setAlerts({
                type: "error",
                content: err.message
            })
        }
    }
    const getHistory = async () => {
        try {
            await axios
                .get(`${process.env.REACT_APP_BACKEND_URL}/api/history/get`)
                .then((res) => {
                    const newGameHistory = res.data;
                    setGameHistory(newGameHistory);
                });
        } catch (err) {
            console.log("Error while getting history: ", err);
            setAlerts({
                type: "error",
                content: err.message
            })
        }
    };

    const double = () => {
        let i = 2 * global.depositAmount;
        global.setDepositAmount(i.toFixed(4));
    }

    const half = () => {
        let i = global.depositAmount / 2;
        global.setDepositAmount(i.toFixed(4));
    }

    return (
        <>
            <FormControl>
                <img src={coinImage} alt='coin' id="coin" />
                <label htmlFor='inputAmount' className="text-label" style={{ textAlign: 'left', color: 'grey' }}>Amount</label>
                <div className="custom-input">
                    <input className="custom-inputbox" type="number" value={global.depositAmount} onChange={inputAmount} id='inputAmount' />
                    <button className="custom-input-half" onClick={half}>/2</button>
                    <button className="custom-input-double" onClick={double}>x2</button>
                </div>
                <label htmlFor='inputValue' className="text-label">
                    <span style={{ textAlign: 'left', color: 'grey' }}>Payout</span>
                    <span style={{ textAlign: 'right', color: 'grey' }}>Chance &nbsp;  {global.percent}%</span>
                </label>
                <input type="number" value={global.payout} onChange={inputValue} id='inputValue' />
                <Button className="betButton" onClick={clickBet}>
                    BET NOW
                </Button>
            </FormControl>
        </>
    )
}

export default LimboPanel;