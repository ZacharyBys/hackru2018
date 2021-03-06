import React from 'react';
import { Grid, Responsive, Button, Loader, Header, Icon } from 'semantic-ui-react';
import socketIOClient from 'socket.io-client';
import { Link } from 'react-router-dom';

import UserCard from '../components/UserCard';
import Chatroom from '../components/Chatroom';
import SelectionModal from '../components/SelectionModal';
import { activate, getUser, updateSId, saveNumber } from '../util/ApiUtil';

const styles = { 
    container: {
        height: '100%',
         
        margin: '0 auto',
    },
};

class Lobby extends React.Component {
    state = { 
        searching: false,
        foundMatch: false,
        socket: null,
        user: false,
        otherUser: false,
        roomId: '',
        timeExpired: false,
        selection: '',
        selectionReceived: false,
        gotContact: 0,
        sentiment: '',
        question: null,
     };

    componentDidMount = async () => {
        const socket = socketIOClient('http://127.0.0.1:5000');
        socket.on('connected', async data => {
            localStorage.setItem('sId', data);
            const userId = localStorage.getItem('userId');
            const reponse = await getUser(userId);
            await updateSId(userId, data);
            this.setState({
                user: reponse.data,
                socket
            });
        });
        socket.on('matched', (user, otherUser, question, roomId) => {
            socket.emit('join', roomId);
            this.setState({
                searching: false,
                foundMatch: true,
                otherUser,
                roomId,
                question,
            });
        });
        socket.on('selectionMade', (gotContact) => {
            this.setState({
                selectionReceived: true,
                gotContact,
            }, async () => {
                if (this.state.gotContact === 2) {
                    const userId = localStorage.getItem('userId');
                    const { number } = this.state.otherUser;
                    try {
                        await saveNumber(userId, number)
                        socket.emit('leave', this.state.roomId)
                        window.location.reload();
                    } catch (error) {

                    }
                } else if (this.state.gotContact < 0) {
                    window.location.reload();
                }
            });
        });
        socket.on('sentimentScore', score => {
            let sentiment;
            console.log(score);
            if (score <= -10) {
                sentiment = 'N/A';
            } else if (score < -0.5 && score >= -1) {
                sentiment = 'Really Bad :(';
            } else if (score < -0.1 && score >= -0.5) {
                sentiment = 'Not So Great';
            } else if (score < 0.1 && score >= -0.1) {
                sentiment = 'Mixed';
            } else if (score < 0.5 && score >= 0.1) {
                sentiment = 'Positive';
            } else {
                sentiment = 'Amazing!';
            }

            this.setState({
                sentiment,
                timeExpired: true
            });
        });
    }

    handleClick = async () => {
        this.setState((state) => ({ searching: !state.searching }), async () => {
            try {
                if (this.state.searching) {
                    const id = localStorage.getItem('userId');
                    await activate(id);
                }
            } catch (err) {
                this.setState({
                    searching: false,
                    foundMatch: false
                })
            }
        });
    };

    onTimerEnd = () => {
        const { socket, roomId } = this.state;
        socket.emit('sentiment', roomId);
        this.setState({ timeExpired: true });
    }

    onSelection = (e, { name, value }) => {
        const { socket, roomId } = this.state;
        if (value === 'yes') {
            socket.emit('selection', { selection: 1, roomId });
        } else if (value === 'no') {
            this.setState({ [name]: value }, () => {
                socket.emit('selection', { selection: -2, roomId });
                window.location.reload()
            })
        }
    }

    render() {
        const { 
            searching, 
            foundMatch, 
            user, 
            otherUser, 
            timeExpired, 
            selection, 
            selectionReceived, 
            gotContact,
            sentiment,
            question,
        } = this.state;

        return (
            <Grid 
            className="home-container" 
            style={styles.container} 
            verticalAlign="middle" 
            centered>
            <Responsive 
                as={Grid.Column} 
                >        
                {
                    !searching && !foundMatch && user &&
                    <UserCard {...user} centered/>
                }      
                { 
                    !searching && !foundMatch &&  user &&
                    <Button 
                        fluid 
                        size="large"
                        style={{ background: '#cc0033', color: 'white', width: '80%', maxWidth: '350px', margin: '0 auto' }} 
                        onClick={this.handleClick}>
                            <Icon name="heart outline"/>
                            Find a match
                    </Button> 
                }
                {
                    !searching && !foundMatch &&  user &&
                    <Button 
                        fluid  
                        size="large"
                        style={{ background: '#cc0033', color: 'white', width: '80%', maxWidth: '350px', margin: '1em auto' }} 
                        as={Link} to={{ pathname: '/numbers', state: { user: user} }}
                        params={{ userId: user }}>
                            <Icon name="phone"/>
                            Saved Numbers
                    </Button> 
                }
                { 
                    searching && 
                    <Loader 
                        active 
                        inline="centered"
                        size="large" 
                        style={{ color: '#cc0033' }}>
                            Looking for a potential match
                    </Loader>
                }
                {
                    searching &&                     
                    <Button 
                        fluid 
                        size="large"
                        style={{ background: '#cc0033', color: 'white', width: '80%', maxWidth: '300px', margin: '1em auto' }} 
                        onClick={this.handleClick}>
                            Go back
                    </Button> 
                }
                {
                    foundMatch && !timeExpired && question &&
                        <Chatroom   
                            time={30}
                            onTimerEnd={this.onTimerEnd}
                            user={this.state.user} 
                            otherUser={this.state.otherUser} 
                            roomId={this.state.roomId} 
                            socket={this.state.socket} 
                            question={question}/>
                }
                {
                    timeExpired && !selectionReceived &&
                    <SelectionModal 
                        open={timeExpired} 
                        onSelection={this.onSelection} 
                        selection={selection}
                        sentiment={sentiment}/>
                }
                {
                    timeExpired && selectionReceived && gotContact === 2 &&
                    <Header textAlign="center" style={{ color: '#cc0033' }}>Awesome! {otherUser.firstName}'s contact information was saved!</Header>
                }
                {
                    timeExpired && selectionReceived && gotContact === -1 &&
                    <Header textAlign="center" style={{ color: '#cc0033' }}>Sorry! Guess things didn't work out with {otherUser.firstName} :(</Header>
                }
            </Responsive>
        </Grid>
        )
    }
}

export default Lobby;
