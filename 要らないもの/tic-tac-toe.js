import readline from 'readline';

class TicTacToe {
    constructor() {
        this.board = [
            [' ', ' ', ' '],
            [' ', ' ', ' '],
            [' ', ' ', ' ']
        ];
        this.currentPlayer = '○';
        this.gameOver = false;
        this.winner = null;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    displayBoard() {
        console.log('\n   0   1   2');
        for (let i = 0; i < 3; i++) {
            console.log(`${i}  ${this.board[i][0]} | ${this.board[i][1]} | ${this.board[i][2]}`);
            if (i < 2) console.log('  ---|---|---');
        }
        console.log();
    }

    makeMove(row, col) {
        if (this.board[row][col] === ' ' && !this.gameOver) {
            this.board[row][col] = this.currentPlayer;
            
            if (this.checkWin()) {
                this.winner = this.currentPlayer;
                this.gameOver = true;
            } else if (this.isBoardFull()) {
                this.gameOver = true;
            } else {
                this.currentPlayer = this.currentPlayer === '○' ? '×' : '○';
            }
            return true;
        }
        return false;
    }

    checkWin() {
        // 横の列をチェック
        for (let row = 0; row < 3; row++) {
            if (this.board[row][0] === this.currentPlayer && 
                this.board[row][1] === this.currentPlayer && 
                this.board[row][2] === this.currentPlayer) {
                return true;
            }
        }

        // 縦の列をチェック
        for (let col = 0; col < 3; col++) {
            if (this.board[0][col] === this.currentPlayer && 
                this.board[1][col] === this.currentPlayer && 
                this.board[2][col] === this.currentPlayer) {
                return true;
            }
        }

        // 斜めをチェック
        if ((this.board[0][0] === this.currentPlayer && 
             this.board[1][1] === this.currentPlayer && 
             this.board[2][2] === this.currentPlayer) ||
            (this.board[0][2] === this.currentPlayer && 
             this.board[1][1] === this.currentPlayer && 
             this.board[2][0] === this.currentPlayer)) {
            return true;
        }

        return false;
    }

    isBoardFull() {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (this.board[row][col] === ' ') {
                    return false;
                }
            }
        }
        return true;
    }

    async playGame() {
        console.log('🎮 三目並べゲーム開始！');
        console.log('○が先攻、×が後攻です');
        console.log('座標を「行 列」の形式で入力してください（例: 1 2）');
        
        while (!this.gameOver) {
            this.displayBoard();
            
            const input = await this.getPlayerInput();
            const [row, col] = input.split(' ').map(Number);
            
            if (isNaN(row) || isNaN(col) || row < 0 || row > 2 || col < 0 || col > 2) {
                console.log('❌ 無効な入力です。0-2の数字を「行 列」で入力してください');
                continue;
            }
            
            if (!this.makeMove(row, col)) {
                console.log('❌ そのマスは既に使用されています');
                continue;
            }
        }
        
        this.displayBoard();
        
        if (this.winner) {
            console.log(`🎉 ${this.winner}の勝利です！`);
        } else {
            console.log('🤝 引き分けです！');
        }
        
        this.rl.close();
    }

    getPlayerInput() {
        return new Promise((resolve) => {
            this.rl.question(`${this.currentPlayer}のターン。座標を入力: `, (answer) => {
                resolve(answer.trim());
            });
        });
    }
}

const game = new TicTacToe();
game.playGame();