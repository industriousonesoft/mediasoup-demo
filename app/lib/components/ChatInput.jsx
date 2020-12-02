import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRoomContext } from '../RoomContext';

const BotMessageRegex = new RegExp('^@bot (.*)');

//React-Redux将所有组件分为两大类，UI组件（presentational component）和容器组件（container component）
//UI组件特点：
//	- 只负责UI的呈现，不涉及任何业务逻辑
//	- 没有状态，即不使用this.state变量
//	- 所有数据都由this.props提供
//	- 不使用任何Redux的API
//ChatInput即为UI组件
class ChatInput extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state =
		{
			text : ''
		};

		// TextArea element got via React ref.
		// @type {HTMLElement}
		this._textareaElem = null;
	}

	render()
	{
		const {
			connected,
			chatDataProducer,
			botDataProducer
		} = this.props;

		const { text } = this.state;

		const disabled = !connected || (!chatDataProducer && !botDataProducer);

		return (
			<div data-component='ChatInput'>
				<textarea
					ref={(elem) => { this._textareaElem = elem; }}
					placeholder={disabled ? 'Chat unavailable' : 'Write here...'}
					dir='auto'
					autoComplete='off'
					disabled={disabled}
					value={text}
					onChange={this.handleChange.bind(this)}
					onKeyPress={this.handleKeyPress.bind(this)}
				/>
			</div>
		);
	}

	handleChange(event)
	{
		const text = event.target.value;

		this.setState({ text });
	}

	handleKeyPress(event)
	{
		// If Shift + Enter do nothing.
		if (event.key !== 'Enter' || (event.shiftKey || event.ctrlKey))
			return;

		// Don't add the sending Enter into the value.
		event.preventDefault();

		let text = this.state.text.trim();

		this.setState({ text: '' });

		if (text)
		{
			const { roomClient } = this.props;
			const match = BotMessageRegex.exec(text);

			// Chat message.
			if (!match)
			{
				text = text.trim();

				roomClient.sendChatMessage(text);
			}
			// Message to the bot.
			else
			{
				text = match[1].trim();

				roomClient.sendBotMessage(text);
			}
		}
	}
}

//ChatInput的属性值
ChatInput.propTypes =
{
	roomClient       : PropTypes.any.isRequired /* isRequired：值不能为空 */,
	connected        : PropTypes.bool.isRequired,
	chatDataProducer : PropTypes.any,
	botDataProducer  : PropTypes.any
};

//该函数用于建立一个从外部的state对象到UI组件的props对象的映射关系
//该函数会订阅Store，每当state更新时就会自动执行，重新计算UI组件的参数，从而触发组件的重新渲染
//第一个参数总是state对象，第二个参数可选，代表容器组件的props对象
const mapStateToProps = (state, ownProps/* Optional */) =>
{
	const dataProducersArray = Object.values(state.dataProducers);
	const chatDataProducer = dataProducersArray
		.find((dataProducer) => dataProducer.label === 'chat');
	const botDataProducer = dataProducersArray
		.find((dataProducer) => dataProducer.label === 'bot');

	return {
		connected : state.room.state === 'connected',
		chatDataProducer,
		botDataProducer
	};
};

//connect：传入UI组件，返回容器组件
const ChatInputContainer = withRoomContext(connect(
	mapStateToProps,
	undefined /* mapDispatchToProps，可以是函数或对象 */
)(ChatInput));

export default ChatInputContainer;
