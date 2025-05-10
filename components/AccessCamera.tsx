import { AntDesign } from '@expo/vector-icons';
import * as Camera from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function AccessCamera() {
    const [image, setImage] = useState<string | null>(null);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await Camera.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            aspect: [4, 3],
            quality: 1,
        });

        console.log(result);

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    return (
        <View style={styles.container}>
            {/* <Button title="Pick an image from camera roll" onPress={pickImage} /> */}
            <View style={{ backgroundColor: '#D9D9D9', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 30, opacity: 0.7 }}>
                <TouchableOpacity onPress={pickImage}>
                    <AntDesign name="camera" size={35} color="black" />
                </TouchableOpacity>
            </View>
            {/* {image && <Image source={{ uri: image }} style={styles.image} />} */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: 200,
        height: 200,
    },
});
