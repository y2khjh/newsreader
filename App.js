import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat'

const uuidv4 = require('uuid/v4');

const defaultUser = {
  _id: 1,
  name: 'News Reader',
}

export default class App extends React.Component {
  state = {
    messages: [],
    loading: true,
    dataSource: [],
  }

  loadData(cb) {
    fetch("https://chautr.com/collection.json")
    .then(response => response.json())
    .then((responseJson)=> {
      this.setState({
        loading: false,
        dataSource: responseJson
      }, () => cb ? cb() : null)
    })
    .catch(error=>console.warn(error)) //to catch the errors if any
  }

  getGreetingMsg() {
    let newMsg = [
      {
        _id: uuidv4(),
        text: 'Hi buddy! How are you today?',
        createdAt: new Date(),
        quickReplies: {
          type: 'radio', // or 'checkbox',
          values: [
            {
              title: '😋 I am very well!',
              value: 'i_am_very_well',
            },
            {
              title: '😞 I am OK.',
              value: 'i_am_ok',
            },
          ],
        },
        user: defaultUser,
      }
    ]
    this.onSend(newMsg)
  }

  getNewMsg() {
    if (this.state.dataSource.length < 1) {
      this.loadData(() => {
        let data = this.state.dataSource.shift()
        this.buildLiteMsgFromData(data)
      })
    } else {
      let data = this.state.dataSource.shift()
      this.buildLiteMsgFromData(data)
    }
  }

  buildLiteMsgFromData(data) {
    let newMsg = []
    let items = data.sequence || [];
    newMsg.push(this.buildMsg(items[0]))
    newMsg.push(this.buildMsg(items[1]))
    let link = this.buildMsg(items[2])
    let action = this.buildMsg(items[3])
    action.quickReplies.values[0].data = data
    link.quickReplies = action.quickReplies
    newMsg.push(link)
    newMsg.reverse()
    this.onSend(newMsg)
  }

  showMsgDetailed(data, cb) {
    //console.warn(data)
    let newMsgs = []
    let items = data.sequence || [];
    for (let i = 4; i < items.length; i++) {
      let newMsg = this.buildMsg(items[i])
      newMsgs.push(newMsg)
    }
    newMsgs.reverse()
    this.onSend(newMsgs)
    return cb ? cb() : null
  }

  buildMsg(item) {
    let msg = {
      _id: uuidv4(),
      text: '',
      createdAt: new Date(item.createdAt),
      user: defaultUser,
    }
    let url = item.url || ''
    switch (item.type) {
      case 1:
          msg.text = item.value
        break
      case 2:
          msg.quickReplies = {
            type: 'radio', // or 'checkbox',
            values: [
              {
                title: item.value,
                value: 'show_detailed',
              },
              {
                title: 'next',
                value: 'show_next',
              },
            ],
          }
        break
      case 3:
      case 4:
          msg.image = item.value
        break
      case 5:
          msg.video = item.value
        break
      case 6:
          msg.text = item.value + ' ' + url
        break
      case 7:
          msg.text = item.url
          msg.image = item.value
        break
      default:
        msg.text = item.value
    }
    return msg
  }

  startRotating() {
    if (!this.timer) {
      this.timer = setInterval(() => this.getNewMsg(), 5000)
    }
  }

  stopRotating() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }

  componentWillMount() {}

  componentDidMount() {
    this.getGreetingMsg()
  }

  onSend(messages = []) {
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }))
  }

  onQuickReply(quickReply) {
    //console.warn(quickReply[0])
    this.stopRotating()
    switch (quickReply[0].value) {
      case 'i_am_very_well':
          this.onSend([{
            _id: uuidv4(),
            text: 'Great! Let\'s show you some news for today!',
            createdAt: new Date(),
            user: defaultUser,
          }])
          this.loadData(() => {
            setTimeout(() => this.getNewMsg(), 1000)
          })
          break
      case 'i_am_ok':
          this.onSend([{
            _id: uuidv4(),
            text: 'No worry. Let me see if I can make you feel better. Please wait...',
            createdAt: new Date(),
            user: defaultUser,
          }])
          this.startRotating()
          break
      case 'show_detailed':
          this.showMsgDetailed(quickReply[0].data, () => {
            this.onSend([{
              _id: uuidv4(),
              text: 'Do you like to see more?',
              createdAt: new Date(),
              quickReplies: {
                type: 'radio', // or 'checkbox',
                values: [
                  {
                    title: '😋 Yes',
                    value: 'show_next',
                  },
                  {
                    title: '😞 I don\'t know',
                    value: 'i_am_ok',
                  },
                ],
              },
              user: defaultUser,
            }])
          })
          break
      case 'show_next':
          this.getNewMsg()
          break
      default:
          this.onSend([{
            _id: uuidv4(),
            text: 'Sorry, what do you say?',
            createdAt: new Date(),
            user: defaultUser,
          }])
          setTimeout(() => this.startRotating(), 3000)
    }
  }

  render() {
    return (
      <GiftedChat
        messages={this.state.messages}
        onSend={messages => this.onSend(messages)}
        onQuickReply={quickReply => this.onQuickReply(quickReply)}
        loadEarlier={true}
        user={{
          _id: 2,
        }}
        renderAvatar={() => null}
        renderDay={() => null}
        renderTime={() => null}
        renderInputToolbar={() => null}
      />
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
