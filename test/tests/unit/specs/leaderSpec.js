describe("Leader",function() {
	var leaders=[];
	var packetQueue=[];
	var fakeRouter={
		jitter:0,
		send: function(packet) {
			if(packetQueue.length===0 || Math.random() > fakeRouter.jitter) {
				packetQueue.push(packet);
			} else {
				console.log("JITTER!");
				packetQueue.splice(-1,0,packet);
			}

		},
		pump: function() {
			var processed=0;
			while(packetQueue.length) {
				processed++;
				var packet=packetQueue.shift();
				console.log("PACKET(" + packet.src + "): " + packet.entity.type);
				leaders.forEach(function(l) {
					if(l.address != packet.src) {
						l.receive(packet);
					}
				});
			}
			return processed;
		},
		createMessage: function(m) { return m;}
	};
	
	var tick=function(t) {
		fakeRouter.pump();
		jasmine.clock().tick(t);
		fakeRouter.pump();
	}
	
	var moveTime=function(step) {
		var elected=false;
		var round=0;
		while(!elected) {
			console.log("============= Round " + round + " ===================");
			round++;
			jasmine.clock().tick(step);
			fakeRouter.pump();
			
			elected=leaders.some(function(l) { return l.isLeader();});
		}
	}
	
	var makeLeader=function(priority) {
		var l=new sibilant.Leader({
			electionAddress:"ea",
			address: leaders.length,
			'priority': priority,
			router: fakeRouter
			
		});
		l.on("startElection", function() {
			console.log("startElection: " + l.address);
		});
		l.on("endElection",function() {
			console.log("endElection: " + l.address);
		});
		l.on("newLeader",function() {
			console.log("newLeader: " + l.address);
		});
		l.on("becameLeader",function() {
			console.log("becameLeader: " + l.address);
		});
		leaders.push(l);
		return l;
	};

	
	beforeEach(function() {
		jasmine.addMatchers(customMatchers);
		jasmine.clock().install();
	});
	
	afterEach(function() {
		leaders=[];
		packetQueue=[];
	});


	it("is not leader when created",function() {
		var leader=makeLeader(1);
		expect(leader.isLeader()).toEqual(false);
	});
	
	it("is leader after one member election",function() {
		var leader=makeLeader(1);
		leader.startElection();
		tick(1000);
		expect(leader.isLeader()).toEqual(true);
	});

	it("two members elect one leader",function() {
		var member=makeLeader(1);
		var leader=makeLeader(2);
		
		leader.startElection();

		tick(1000);
		
		expect(leader.isLeader()).toEqual(true);
		expect(member.isLeader()).toEqual(false);
	});	
	
	it("higher priority will take over",function() {
		var member=makeLeader(1);
		member.startElection();
		tick(1000);
		
		expect(member.isLeader()).toEqual(true);


		var leader=makeLeader(2);
		leader.startElection();
		tick(1000);
		
		expect(leader.isLeader()).toEqual(true);
		expect(member.isLeader()).toEqual(false);
	});
	it("twelve members will elect the correct leader with the lowest one starting the election",function() {
		depth=100;
		var lowbie=makeLeader(1);
		for(var i=10; i< 20; ++i) {
			makeLeader(i);
		}
		var leader=makeLeader(100);
		
		lowbie.startElection();
		
		tick(1000);
		
		for(var i=0; i< leaders.length-1; ++i) {
			expect(leaders[i].isLeader()).toEqual(false);
		}
		
		expect(leader.isLeader()).toEqual(true);
		
	});


	// since the jitter is random, run several rounds of it
	for(var j=0;j<15;++j) {
		it("member election works with jitter, round " + j,function() {
			fakeRouter.jitter=.5;

			var lowbie=makeLeader(1);
			for(var i=10; i< 20; ++i) {
				makeLeader(i);
			}
			var leader=makeLeader(100);

			lowbie.startElection();

			// step forward time by 50ms at a shot until the chatter stops
			moveTime(10);

			for(var i=0; i< leaders.length-1; ++i) {
				if(leaders[i].isLeader()) {
					console.log("Leader " + i + " thinks he is the bully");
				}
				expect(leaders[i].isLeader()).toEqual(false);
			}

			expect(leader.isLeader()).toEqual(true);

		});
	}
});