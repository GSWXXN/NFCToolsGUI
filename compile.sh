#!/bin/bash
# C:\msys64\msys2_shell.cmd -msys -defterm -here -no-start -c ./compile.sh
set -e

os=$(uname -o)

if [ "$os" != "Msys" ] && [ "$os" != "Darwin" ]; then
    echo "This system is neither Msys nor Darwin. Exiting..."
    exit 1
fi

echo "============================== os = ""$os"" =============================="

# install msys2 dependancy
echo "============================== install msys dependancy =============================="
if [ "$os" == "Msys" ]; then
    pacman -S --noconfirm unzip
    pacman -S --noconfirm zlib-devel
    pacman -S --noconfirm autotools
    pacman -S --noconfirm pkg-config
    pacman -S --noconfirm gcc
    pacman -S --noconfirm liblzma-devel
    pacman -S --noconfirm libreadline-devel
fi

workdir=$(pwd)
prefix=$workdir/framework
rm -rf "$prefix"
rm -rf "$workdir"/work
mkdir "$prefix"
mkdir "$workdir"/work
cd "$workdir"/work

# libusb
if [ "$os" == "Darwin" ]; then
    echo
    echo
    echo ============================== libusb ==============================
    curl -LO https://pub-3d2f9df4304d45e38bbebe723816c4a3.r2.dev/libusb-legacy-0.1.12_4.darwin_22.x86_64.tbz2
    tar -xvf libusb-legacy-0.1.12_4.darwin_22.x86_64.tbz2
    mv ./opt/local/* "$prefix"/
fi


# libnfc
echo
echo
echo "============================== libnfc =============================="
curl -LO https://github.com/GSWXXN/libnfc/archive/refs/heads/libnfc.zip
unzip ./libnfc.zip
cd ./libnfc-libnfc
if [ "$os" == "Msys" ]; then
    aclocal -I m4 --install
fi
autoreconf -vis
autoreconf -is
./configure prefix="$prefix" LDFLAGS=-L"$prefix"/lib/libusb-legacy --with-drivers=pn532_uart
make && make install
cd ../


# mfoc
echo
echo
echo "============================== mfoc =============================="
curl -Lo mfoc.zip https://github.com/GSWXXN/mfoc/archive/refs/heads/master.zip
unzip mfoc.zip
cd ./mfoc-master
autoreconf -vis
./configure LDFLAGS=-L"$prefix"/lib PKG_CONFIG_PATH="$prefix"/lib/pkgconfig prefix="$prefix"
make && make install
cd ../



# nfc-mfdict
echo
echo
echo "============================== nfc-mfdict =============================="
curl -LO https://github.com/GSWXXN/mfoc/archive/refs/heads/nfc-mfdict.zip
unzip nfc-mfdict.zip
cd ./mfoc-nfc-mfdict
autoreconf -vis
./configure LDFLAGS=-L"$prefix"/lib PKG_CONFIG_PATH="$prefix"/lib/pkgconfig prefix="$prefix"
make && make install
cd ../


# nfc-mfdetect
echo
echo
echo "============================== nfc-mfdetect =============================="
curl -LO https://github.com/GSWXXN/mfoc/archive/refs/heads/nfc-mfdetect.zip
unzip nfc-mfdetect.zip
cd ./mfoc-nfc-mfdetect
autoreconf -vis
./configure LDFLAGS=-L"$prefix"/lib PKG_CONFIG_PATH="$prefix"/lib/pkgconfig prefix="$prefix"
make && make install
cd ../


# nfc-mflock
echo
echo
echo "============================== nfc-mflock =============================="
curl -LO https://github.com/GSWXXN/nfc-mflock/archive/refs/heads/nfc-mflock.zip
unzip nfc-mflock.zip
cd ./nfc-mflock-nfc-mflock
autoreconf -vis
./configure LDFLAGS=-L"$prefix"/lib prefix="$prefix" CPPFLAGS=-I"$prefix"/include
make && make install
cd ../


# libnfc_collect
echo
echo
echo "============================== libnfc_collect =============================="
curl -LO https://github.com/GSWXXN/crypto1_bs/archive/refs/heads/libnfc_collect.zip
unzip libnfc_collect.zip
cd ./crypto1_bs-libnfc_collect
curl -LO https://pub-3d2f9df4304d45e38bbebe723816c4a3.r2.dev/craptev1-v1.1.tar.xz
tar -xf craptev1-v1.1.tar.xz
mkdir crapto1-v3.3
curl -LO https://pub-3d2f9df4304d45e38bbebe723816c4a3.r2.dev/crapto1-v3.3.tar.xz
tar -xf crapto1-v3.3.tar.xz -C crapto1-v3.3
autoreconf -vis
if [ "$(uname -m)" == "arm64" ] && [ "$os" == "Darwin" ]; then
    ./configure LDFLAGS=-L"$prefix"/lib prefix="$prefix" CPPFLAGS=-I"$prefix"/include CFLAGS='-std=gnu99 -O3 -mcpu=apple-m1'
else
    ./configure LDFLAGS=-L"$prefix"/lib' '-Wl,--allow-multiple-definition prefix="$prefix" CPPFLAGS=-I"$prefix"/include CFLAGS='-std=gnu99 -O3 -march=native'
fi
make && make install
cd ../


# cropto1_bs
echo
echo
echo "============================== cropto1_bs =============================="
curl -LO https://github.com/GSWXXN/cropto1_bs/archive/refs/heads/cropto1_bs.zip
unzip cropto1_bs.zip
cd ./cropto1_bs-cropto1_bs
autoreconf -vis
./configure prefix="$prefix" CFLAGS=-I/opt/local/include' '-I"$prefix"/include LDFLAGS=-L"$prefix"/lib
make && make install



# copy library
if [ "$os" == "Msys" ]; then
    echo
    echo
    echo "============================== copy library =============================="
    cp /usr/bin/msys-lzma-5.dll "$prefix"/bin
    cp /usr/bin/msys-2.0.dll "$prefix"/bin
    cp /usr/bin/msys-readline8.dll "$prefix"/bin
    cp /usr/bin/msys-gcc_s-seh-1.dll "$prefix"/bin
    cp /usr/bin/msys-ncursesw6.dll "$prefix"/bin
fi


# delete useless program
echo
echo
echo "============================== delete useless program =============================="
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
if [ "$os" == "Msys" ]; then
    mv "$prefix"/bin2/*.dll "$prefix"/bin
fi

# clean
echo
echo
echo "============================== clean up =============================="
rm -rf "$prefix"/bin2/
rm -rf "$prefix"/include/
rm -rf "$prefix"/share/
rm -rf "$workdir"/work
if [ "$os" == "Msys" ]; then
    rm -rf "$prefix"/lib/
fi


# install_name_tool -change
if [ "$os" == "Darwin" ]; then
    echo
    echo
    echo "============================== install_name_tool =============================="
    for i in $(ls "$prefix"/bin); do install_name_tool -change "$prefix"/lib/libnfc.6.dylib @loader_path/../lib/libnfc.6.dylib "$prefix"/bin/"$i"; done
    for i in $(ls "$prefix"/bin); do install_name_tool -change /usr/local/lib/libnfc.6.dylib @loader_path/../lib/libnfc.6.dylib "$prefix"/bin/"$i"; done
fi
