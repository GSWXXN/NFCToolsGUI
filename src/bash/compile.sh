workdir=$HOME/Desktop/folder


prefix=$workdir/framework
mkdir $workdir
mkdir $prefix
mkdir $workdir/work
cd $workdir/work

# libusb
curl -LO https://pub-3d2f9df4304d45e38bbebe723816c4a3.r2.dev/libusb-legacy-0.1.12_4.darwin_22.x86_64.tbz2
tar -xvf libusb-legacy-0.1.12_4.darwin_22.x86_64.tbz2
mv ./opt/local/* $prefix/

# libnfc
curl -LO https://github.com/GSWXXN/libnfc/archive/refs/heads/libnfc.zip
unzip ./libnfc.zip
cd ./libnfc-libnfc
autoreconf -vis
autoreconf -is
./configure prefix=$prefix LDFLAGS=-L$prefix/lib/libusb-legacy --with-drivers=pn532_uart
make && make install
cd ../

# mfoc
curl -Lo mfoc.zip https://github.com/GSWXXN/mfoc/archive/refs/heads/master.zip
unzip mfoc.zip
cd ./mfoc-master
autoreconf -is
./configure LDFLAGS=-L$prefix/lib PKG_CONFIG_PATH=$prefix/lib/pkgconfig prefix=$prefix
make && make install
cd ../

# nfc-mfdict
curl -LO https://github.com/GSWXXN/mfoc/archive/refs/heads/nfc-mfdict.zip
unzip nfc-mfdict.zip
cd ./mfoc-nfc-mfdict
autoreconf -is
./configure LDFLAGS=-L$prefix/lib PKG_CONFIG_PATH=$prefix/lib/pkgconfig prefix=$prefix
make && make install
cd ../

# nfc-mfdetect
curl -LO https://github.com/GSWXXN/mfoc/archive/refs/heads/nfc-mfdetect.zip
unzip nfc-mfdetect.zip
cd ./mfoc-nfc-mfdetect
autoreconf -is
./configure LDFLAGS=-L$prefix/lib PKG_CONFIG_PATH=$prefix/lib/pkgconfig prefix=$prefix
make && make install
cd ../

# nfc-mflock
curl -LO https://github.com/GSWXXN/nfc-mflock/archive/refs/heads/nfc-mflock.zip
unzip nfc-mflock.zip
cd ./nfc-mflock-nfc-mflock
autoreconf -is
./configure LDFLAGS=-L$prefix/lib prefix=$prefix CPPFLAGS=-I$prefix/include
make && make install
cd ../


# libnfc_collect
curl -LO https://github.com/GSWXXN/crypto1_bs/archive/refs/heads/libnfc_collect.zip
unzip libnfc_collect.zip
cd ./crypto1_bs-libnfc_collect
curl -LO https://pub-3d2f9df4304d45e38bbebe723816c4a3.r2.dev/craptev1-v1.1.tar.xz
tar -xf craptev1-v1.1.tar.xz
mkdir crapto1-v3.3
curl -LO https://pub-3d2f9df4304d45e38bbebe723816c4a3.r2.dev/crapto1-v3.3.tar.xz
tar -xf crapto1-v3.3.tar.xz -C crapto1-v3.3
autoreconf -is
./configure LDFLAGS=-L$prefix/lib prefix=$prefix CPPFLAGS=-I$prefix/include CFLAGS='-std=gnu99 -O3 -mcpu=apple-m1'
make && make install
cd ../

# hfmfhard
curl -LO https://github.com/GSWXXN/proxmark3/archive/refs/heads/hfmfhard.zip
unzip hfmfhard.zip
cd ./proxmark3-hfmfhard/client
autoreconf -is
./configure prefix=$prefix
make && make install

mkdir $prefix/bin2/
mv $prefix/bin/* $prefix/bin2/
mv $prefix/bin2/nfc-list $prefix/bin/nfc-list
mv $prefix/bin2/nfc-mfclassic $prefix/bin/nfc-mfclassic
mv $prefix/bin2/nfc-mfdict $prefix/bin/nfc-mfdict
mv $prefix/bin2/mfoc $prefix/bin/mfoc
mv $prefix/bin2/nfc-mfdetect $prefix/bin/nfc-mfdetect
mv $prefix/bin2/nfc-mflock $prefix/bin/nfc-mflock
mv $prefix/bin2/libnfc-collect $prefix/bin/libnfc-collect
mv $prefix/bin2/hfmfhard $prefix/bin/hfmfhard
mv $prefix/bin2/hardnested $prefix/bin/hardnested
rm -rf $prefix/bin2/
rm -rf $prefix/include/
rm -rf $prefix/share/
rm -rf $workdir/work

for i in $(ls $prefix/bin); do install_name_tool -change $prefix/lib/libnfc.6.dylib @loader_path/../lib/libnfc.6.dylib $prefix/bin/$i; done
for i in $(ls $prefix/bin); do install_name_tool -change /usr/local/lib/libnfc.6.dylib @loader_path/../lib/libnfc.6.dylib $prefix/bin/$i; done

cd $workdir
open .