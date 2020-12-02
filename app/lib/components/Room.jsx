import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import classnames from 'classnames';
import clipboardCopy from 'clipboard-copy';
import * as appPropTypes from './appPropTypes';
import { withRoomContext } from '../RoomContext';
import * as requestActions from '../redux/requestActions';
import { Appear } from './transitions';
import Me from './Me';
import ChatInput from './ChatInput';
import Peers from './Peers';
import Stats from './Stats';
import Notifications from './Notifications';
import NetworkThrottle from './NetworkThrottle';

class Room extends React.Component {
	render() {
		const {
			roomClient,
			room,
			me,
			amActiveSpeaker,
			onRoomLinkCopy
		} = this.props;

		return (
			<Appear duration={300}>
				<div data-component='Room'>
					<Notifications />

					<div className='state'>
						<div className={classnames('icon', room.state)} />
						<p className={classnames('text', room.state)}>{room.state}</p>
					</div>

					<div className='room-link-wrapper'>
						<div className='room-link'>
							<a
								className='link'
								href={room.url}
								target='_blank'
								rel='noopener noreferrer'
								onClick={(event) => {
									// If this is a 'Open in new window/tab' don't prevent
									// click default action.
									if (
										event.ctrlKey || event.shiftKey || event.metaKey ||
										// Middle click (IE > 9 and everyone else).
										(event.button && event.button === 1)
									) {
										return;
									}

									event.preventDefault();

									clipboardCopy(room.url)
										.then(onRoomLinkCopy);
								}}
							>
								invitation link
							</a>
						</div>
					</div>

					<Peers />

					<div
						className={classnames('me-container', {
							'active-speaker': amActiveSpeaker
						})}
					>
						<Me />
					</div>

					<div className='chat-input-container'>
						<ChatInput />
					</div>

					<div className='sidebar'>
						<div
							className={classnames('button', 'hide-videos', {
								on: me.audioOnly,
								disabled: me.audioOnlyInProgress
							})}
							data-tip={'Show/hide participants\' video'}
							onClick={() => {
								me.audioOnly
									? roomClient.disableAudioOnly()
									: roomClient.enableAudioOnly();
							}}
						/>

						<div
							className={classnames('button', 'mute-audio', {
								on: me.audioMuted
							})}
							data-tip={'Mute/unmute participants\' audio'}
							onClick={() => {
								me.audioMuted
									? roomClient.unmuteAudio()
									: roomClient.muteAudio();
							}}
						/>

						<div
							className={classnames('button', 'restart-ice', {
								disabled: me.restartIceInProgress
							})}
							data-tip='Restart ICE'
							onClick={() => roomClient.restartIce()}
						/>
					</div>

					<Stats />

					<If condition={window.NETWORK_THROTTLE_SECRET}>
						<NetworkThrottle
							secret={window.NETWORK_THROTTLE_SECRET}
						/>
					</If>

					<ReactTooltip
						type='light'
						effect='solid'
						delayShow={100}
						delayHide={100}
						delayUpdate={50}
					/>
				</div>
			</Appear>
		);
	}

	componentDidMount() {
		const { roomClient } = this.props;

		roomClient.join();
	}
}

//NOTE: 
//roomClient参数是通过withRoomContext传入
//room\me\amActiveSpeaker是通过mapStateToProps函数传入
//onRoomLinkCopy是通过mapDispatchToProps函数传入
Room.propTypes =
{
	roomClient: PropTypes.any.isRequired,
	room: appPropTypes.Room.isRequired,
	me: appPropTypes.Me.isRequired,
	amActiveSpeaker: PropTypes.bool.isRequired,
	onRoomLinkCopy: PropTypes.func.isRequired
};

//输入逻辑：使用外部的state（应该就是store的state）更新Room组件（UI组件）的props值
const mapStateToProps = (state) => {
	return {
		room: state.room,
		me: state.me,
		amActiveSpeaker: state.me.id === state.room.activeSpeakerId
	};
};

//输出逻辑：将UI组件中用户的操作封装成action并dispatch出去
const mapDispatchToProps = (dispatch) => {
	return {
		onRoomLinkCopy: () => {
			dispatch(requestActions.notify(
				{
					text: 'Room link copied to the clipboard'
				}));
		}
	};
};

//connect是一个高阶函数，接受的参数是函数，返回值也是函数
//其作用在于基于Room这个UI组件封装一个容器组件（Container）
//容器组件本身继承于component，但是用于负责管理数据和业务逻辑，包括触发UI组件的render函数，有内部状态，与UI组件一一对应
//我猜之所以增加容器组件这一层，原因包括两个：一是保持UI组件的纯粹，props作为唯一的数据源；二是容器组件的封装逻辑是可重用的，因此使用connect函数来屏蔽细节
const RoomContainer = withRoomContext(connect(
	mapStateToProps,
	mapDispatchToProps
)(Room));

//FIXME: 此处RoomContainer经过withRooomContext封装后返回的是一个箭头函数而非组件，那么是在何处调用了函数转换成组件的？
export default RoomContainer;
