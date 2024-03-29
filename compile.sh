#!/bin/bash
set -e

case $(uname -s) in
    MINGW64*)
        os="MINGW64"
        echo "Running on MINGW64"
        ;;
    Darwin*)
        os="Darwin"
        echo "Running on MacOS"
        ;;
    Linux*)
        os="Linux"
        echo "Running on Linux"
        ;;
    *)
        echo "$os: This system is not supported. Exiting..."
        exit 1
        ;;
esac

# install msys2 dependency
if [ "$os" = "MINGW64" ]; then
    echo "============================== install msys dependency =============================="
    pacman -S --noconfirm unzip
    pacman -S --noconfirm mingw-w64-x86_64-crt-git
    pacman -S --noconfirm mingw-w64-x86_64-gcc
    pacman -S --noconfirm mingw-w64-x86_64-make
    pacman -S --noconfirm mingw-w64-x86_64-pkgconf
    pacman -S --noconfirm mingw-w64-x86_64-zlib
    pacman -S --noconfirm mingw-w64-x86_64-autotools
    pacman -S --noconfirm mingw-w64-x86_64-cmake
    pacman -S --noconfirm mingw-w64-x86_64-xz
    pacman -S --noconfirm mingw-w64-x86_64-readline
    pacman -S --noconfirm mingw-w64-x86_64-headers-git
fi

workdir=$(pwd)
prefix=$workdir/framework
source=$workdir/source
rm -rf "$prefix"
mkdir "$prefix"
mkdir "$prefix"/bin

# libusb
cd "$source"
  echo
  echo
  echo "============================== libusb =============================="
if [ "$os" = "MINGW64" ]; then
    curl -Lo libusb-win32.zip https://github.com/mcuee/libusb-win32/releases/download/snapshot_1.2.7.3/libusb-win32-bin-1.2.7.3.zip
    unzip -o libusb-win32.zip
    cd ./libusb-win32-bin-1.2.7.3
    cp ./bin/x86/libusb0_x86.dll "$prefix"/bin/libusb0.dll
    cp -a ./include "$prefix"
    cp -a ./lib "$prefix"
elif [ "$os" = "Darwin" ]; then
    mkdir -p ./libusb
    cd ./libusb
    curl -LO https://pub-3d2f9df4304d45e38bbebe723816c4a3.r2.dev/libusb-legacy-0.1.12_4.darwin_22.x86_64.tbz2
    tar -xvf libusb-legacy-0.1.12_4.darwin_22.x86_64.tbz2
    mv ./opt/local/* "$prefix"/
else
    curl -LO https://pub-3d2f9df4304d45e38bbebe723816c4a3.r2.dev/libusb-0.1.12.zip
    unzip -o libusb-0.1.12.zip
    cd ./libusb-0.1.12
    ./configure prefix="$prefix"
    make && make install
fi


# libnfc
echo
echo
echo "============================== libnfc =============================="
cd "$source"/libnfc
if [ "$os" = "MINGW64" ]; then
    CMAKE_INSTALL_PREFIX=$prefix
    LIBNFC_DRIVER_ACR122S=OFF
    LIBNFC_DRIVER_ACR122_USB=OFF
    LIBNFC_DRIVER_ARYGON=OFF
    LIBNFC_DRIVER_PN53X_USB=OFF
    LIBUSB_INCLUDE_DIRS=$prefix/include
    LIBUSB_LIBRARIES=$prefix/lib/gcc/libusb.a
    cmake -G "MinGW Makefiles" -DCMAKE_INSTALL_PREFIX="$CMAKE_INSTALL_PREFIX" -DLIBUSB_INCLUDE_DIRS="$LIBUSB_INCLUDE_DIRS" -DLIBUSB_LIBRARIES="$LIBUSB_LIBRARIES" -DLIBNFC_DRIVER_ACR122S="$LIBNFC_DRIVER_ACR122S" -DLIBNFC_DRIVER_ACR122_USB="$LIBNFC_DRIVER_ACR122_USB" -DLIBNFC_DRIVER_ARYGON=$LIBNFC_DRIVER_ARYGON -DLIBNFC_DRIVER_PN53X_USB=$LIBNFC_DRIVER_PN53X_USB
    mingw32-make install
    cp ./libnfc/libnfc.dll.a "$prefix"/lib/libnfc.a
    cp ./contrib/win32/err.h "$prefix"/include
else
    autoreconf -vis
    autoreconf -is
    ./configure prefix="$prefix" LDFLAGS=-L"$prefix"/lib/libusb-legacy --with-drivers=pn532_uart
    make && make install
fi


# mfoc
echo
echo
echo "============================== mfoc =============================="
cd "$source"/mfoc
autoreconf -vis
if [ "$os" = "MINGW64" ]; then
    LIBS=$prefix/lib/libnfc.a ./configure LDFLAGS=-L"$prefix"/lib CPPFLAGS=-I"$prefix"/include PKG_CONFIG=: prefix="$prefix"
else
    ./configure LDFLAGS=-L"$prefix"/lib PKG_CONFIG_PATH="$prefix"/lib/pkgconfig prefix="$prefix"
fi
make && make install



# nfc-mfdict
echo
echo
echo "============================== nfc-mfdict =============================="
cd "$source"/nfc-mfdict
autoreconf -vis
if [ "$os" = "MINGW64" ]; then
    LIBS=$prefix/lib/libnfc.a ./configure LDFLAGS=-L"$prefix"/lib CPPFLAGS=-I"$prefix"/include PKG_CONFIG=: prefix="$prefix"
else
    ./configure LDFLAGS=-L"$prefix"/lib PKG_CONFIG_PATH="$prefix"/lib/pkgconfig prefix="$prefix"
fi
make && make install


# nfc-mfdetect
echo
echo
echo "============================== nfc-mfdetect =============================="
cd "$source"/nfc-mfdetect
autoreconf -vis
if [ "$os" = "MINGW64" ]; then
    LIBS=$prefix/lib/libnfc.a ./configure LDFLAGS=-L"$prefix"/lib CPPFLAGS=-I"$prefix"/include PKG_CONFIG=: prefix="$prefix"
else
    ./configure LDFLAGS=-L"$prefix"/lib PKG_CONFIG_PATH="$prefix"/lib/pkgconfig prefix="$prefix"
fi
make && make install


# nfc-mflock
echo
echo
echo "============================== nfc-mflock =============================="
cd "$source"/nfc-mflock
autoreconf -vis
./configure LDFLAGS=-L"$prefix"/lib prefix="$prefix" CPPFLAGS=-I"$prefix"/include
make && make install


# libnfc_collect
echo
echo
echo "============================== libnfc_collect =============================="
cd "$source"/libnfc_collect
curl -LO https://pub-3d2f9df4304d45e38bbebe723816c4a3.r2.dev/craptev1-v1.1.tar.xz
tar -xf craptev1-v1.1.tar.xz
mkdir -p crapto1-v3.3
curl -LO https://pub-3d2f9df4304d45e38bbebe723816c4a3.r2.dev/crapto1-v3.3.tar.xz
tar -xf crapto1-v3.3.tar.xz -C crapto1-v3.3
autoreconf -vis
if [ "$os" = "Darwin" ]; then
    ./configure LDFLAGS=-L"$prefix"/lib prefix="$prefix" CPPFLAGS=-I"$prefix"/include CFLAGS='-std=gnu99 -O3'
else
    ./configure LDFLAGS=-L"$prefix"/lib' '-Wl,--allow-multiple-definition prefix="$prefix" CPPFLAGS=-I"$prefix"/include CFLAGS='-std=gnu99 -O3 -march=native'
fi
make libnfc-collect && make install


# cropto1_bs
echo
echo
echo "============================== cropto1_bs =============================="
cd "$source"/cropto1_bs
autoreconf -vis
./configure prefix="$prefix" CFLAGS=-I/opt/local/include' '-I"$prefix"/include LDFLAGS=-L"$prefix"/lib
make && make install



# copy library
if [ "$os" = "MINGW64" ]; then
    echo "- copy library"
    cp /mingw64/bin/libreadline8.dll "$prefix"/bin
    cp /mingw64/bin/libtermcap-0.dll "$prefix"/bin
    cp /mingw64/bin/libwinpthread-1.dll "$prefix"/bin
fi


# delete useless program
echo "- delete useless program"
mkdir "$prefix"/bin2/
mv "$prefix"/bin/* "$prefix"/bin2/

mv "$prefix"/bin2/nfc-list* "$prefix"/bin
mv "$prefix"/bin2/nfc-mfclassic* "$prefix"/bin
mv "$prefix"/bin2/nfc-mfdict* "$prefix"/bin
mv "$prefix"/bin2/mfoc* "$prefix"/bin
mv "$prefix"/bin2/nfc-mfdetect* "$prefix"/bin
mv "$prefix"/bin2/nfc-mflock* "$prefix"/bin
mv "$prefix"/bin2/libnfc-collect* "$prefix"/bin
mv "$prefix"/bin2/cropto1_bs* "$prefix"/bin
if [ "$os" = "MINGW64" ]; then
    mv "$prefix"/bin2/*.dll "$prefix"/bin
fi

# clean
echo "- clean up"
rm -rf "$prefix"/bin2/
rm -rf "$prefix"/include/
rm -rf "$prefix"/share/
rm -rf "$prefix"/lib/pkgconfig/
rm -rf "$prefix"/lib/*.la
if [ "$os" = "MINGW64" ]; then
    rm -rf "${prefix:?}/lib/"
fi


# install_name_tool -change
if [ "$os" = "Darwin" ]; then
    echo "- install_name_tool"
    cd "$prefix"/bin
    for i in *; do
        install_name_tool -change "$prefix"/lib/libnfc.6.dylib @loader_path/../lib/libnfc.6.dylib "$prefix"/bin/"$i"
    done

    for i in *; do
        install_name_tool -change /usr/local/lib/libnfc.6.dylib @loader_path/../lib/libnfc.6.dylib "$prefix"/bin/"$i"
    done
elif [ "$os" = "Linux" ]; then
    echo "- patchelf"
    cd "$prefix"/bin
    for i in *; do
        patchelf --set-rpath '$ORIGIN/../lib/' "$prefix"/bin/"$i"
    done
fi
echo "- Done!"
