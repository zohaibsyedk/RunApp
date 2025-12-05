import React from "react";
import { View, Text, StyleSheet, DimensionValue, Image, ImageSourcePropType } from "react-native";
import { Ionicons } from '@expo/vector-icons';


interface StatusBarProps {
    percentage: number;
    rankUrl: ImageSourcePropType;
    nextRankUrl: ImageSourcePropType;
    messagesReceived?: number;
    rankIdx: number;
    nextRankIdx: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ percentage, rankUrl, nextRankUrl, messagesReceived = 0, rankIdx, nextRankIdx }) => {
    const rankNames = ["Unranked","Bronze I", "Bronze II", "Bronze III", "Silver I", "Silver II", "Silver III", "Gold I", "Gold II", "Gold III", "Platinum I", "Platinum II", "Platinum III", "Diamond"];
    return (
        <View style={styles.container}>
            <View style={styles.statusBarContainer}>
                <View style={[styles.fill, { width: `${percentage}%` as DimensionValue }]} />
            </View>
            <View style={styles.infoContainer}>
                <View>
                    <View style={styles.largeSquare}>
                        <Text style={styles.largeSquareTitle}>Messages Received</Text>
                        <Text style={styles.largeSquareValue}>{messagesReceived}</Text>
                        <Text style={styles.largeSquareSubtext}>Keep running to rank up!</Text>
                        <Text style={styles.largeSquareRankText}>Current Rank: {rankNames[rankIdx]}</Text>
                        <Text style={styles.largeSquareRankText}>Next Rank Up: {rankNames[nextRankIdx]}</Text>
                    </View>
                </View>
                <View>
                    <View style={styles.smallSquare}>
                        <Image source={rankUrl} style={styles.rankImage} />
                    </View>
                    <View style={styles.smallSquare}>
                        <Image source={nextRankUrl} style={styles.rankImage} />
                        <View style={styles.nextRankImageOverlay}>
                            <Ionicons name="lock-closed" size={30} color="#DDDDDD" />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    statusBarContainer: {
        height: 30,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        borderWidth: 1,
        borderColor: 'rgb(163, 163, 163)',
        borderRadius: 15,
        overflow: 'hidden',
    },
    fill: {
        backgroundColor: '#7bcf56',
        height: 30,
        borderRadius: 13,
        alignSelf: 'flex-start',
        alignItems: 'flex-end',
    },
    infoContainer: {
        marginTop: 30,
        flex: 1,
        flexDirection: 'row',
    },
    largeSquare: {
        width: 220,
        height: 170,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderRadius: 10,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
    },
    largeSquareTitle: {
        fontSize: 16,
        color: '#DDDDDD',
        marginBottom: 10,
        textAlign: 'center',
    },
    largeSquareValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#F2F0EF',
        marginBottom: 8,
        textAlign: 'center',
    },
    largeSquareSubtext: {
        fontSize: 14,
        color: '#F2F0EF',
        textAlign: 'center',
    },
    largeSquareRankText: {
        marginTop: 5,
        fontSize: 12,
        color: '#AAAAAA',
        textAlign: 'center',
    },
    smallSquare: {
        width: 120,
        height: 80,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderRadius: 10,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    rankImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    nextRankImageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
})

export default StatusBar;