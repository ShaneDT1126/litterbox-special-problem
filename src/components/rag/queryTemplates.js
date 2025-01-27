const queryTemplates = {
    greeting: [
        "Introduction to computer architecture topics"
    ],
    farewell: [
        "Concluding computer architecture discussion",
        "Summarizing key points in computer architecture"
    ],
    help: [
        "Common issues in understanding computer architecture",
        "Study tips for computer architecture"
    ],
    cpu: [
        "What is {query} in CPU architecture",
        "How does {query} relate to CPU performance",
        "Explain the role of {query} in modern CPUs",
        "Describe the function of {query} in processor design",
        "What are the key components of {query} in CPU organization"
    ],
    memory: [
        "What is {query} in computer memory systems",
        "How does {query} affect memory performance",
        "Explain the concept of {query} in memory hierarchy"
    ],
    instruction_set: [
        "What is {query} in instruction set architecture",
        "How does {query} impact CPU design",
        "Explain the importance of {query} in ISA"
    ],
    cache: [
        "What is {query} in cache memory systems",
        "How does {query} improve cache performance",
        "Explain the role of {query} in cache hierarchy"
    ],
    pipelining: [
        "What is {query} in CPU pipelining",
        "How does {query} affect pipeline performance",
        "Explain the concept of {query} in modern pipeline designs"
    ],
    cache_coherence: [
        "What is the role of {query} in multiprocessor cache coherence",
        "How does {query} protocol handle shared data updates",
        "Explain snooping vs directory-based methods for {query}"
    ],
    branch_prediction: [
        "How does {query} optimize pipeline performance",
        "What are common algorithms for {query}",
        "Explain the effect of misprediction penalties for {query}"
    ],
    interrupts: [
        "How does {query} work in CPU interrupt handling",
        "Explain hardware vs software triggers for {query}",
        "How do interrupt vectors affect {query}"
    ],
    bus_architecture: [
        "Describe how {query} organizes data transfers",
        "What role does {query} play in multi-device communication",
        "Explain how bandwidth is affected by {query}"
    ],
    hyperthreading: [
        "How does {query} exploit CPU resources",
        "What performance gains does {query} provide",
        "Explain potential scheduling implications for {query}"
    ],
    virtualization: [
        "How does {query} affect hardware resource allocation",
        "Why are VT-x or AMD-V important for {query} support",
        "Explain hypervisor roles in {query}"
    ],
    parallel_processing: [
        "What is {query} in a parallel context",
        "How does {query} scale across multiple cores",
        "Explain synchronization constraints introduced by {query}"
    ],
    arithmetic_logic: [
        "How does {query} handle fixed vs floating-point operations",
        "Explain ALU design trade-offs for {query}",
        "What performance impacts does {query} have in real hardware"
    ],
    bus_communication: [ 
        "What is {query} in bus communication protocols?", 
        "How does {query} impact bus arbitration?", 
        "Explain the role of {query} in synchronous and asynchronous buses." 
    ],
    
    instruction_decoding: [ 
        "What is {query} in instruction decoding?", 
        "How does {query} affect execution cycles?", 
        "Explain the process of {query} in CPU instruction handling." 
    ],
    
    data_cache: [ 
        "What is {query} in data caching?", 
        "How does {query} improve memory access efficiency?", 
        "Explain cache miss penalties caused by {query}." 
    ],
    
    pipeline_hazards: [ 
        "What is {query} in pipeline hazards?", 
        "How does {query} stall CPU performance?", 
        "Explain techniques to mitigate {query} in instruction pipelines." 
    ],
    
    multithreading: [ 
        "What is {query} in multithreading?", 
        "How does {query} differ from multiprocessing?", 
        "Explain the advantages and challenges of {query} in CPUs." 
    ],
    
    storage_devices: [ 
        "What is {query} in storage device architecture?", 
        "How does {query} compare between SSDs and HDDs?", 
        "Explain the impact of {query} on read/write performance." 
    ],
    
    cache_optimization: [ 
        "What is {query} in cache optimization?", 
        "How does {query} affect cache hit rates?", 
        "Explain strategies for improving {query} in cache design." 
    ],
    
    branch_handling: [ 
        "What is {query} in branch handling?", 
        "How does {query} improve control flow in pipelines?", 
        "Explain the effects of {query} on branch prediction accuracy." 
    ],
    
    instruction_formats: [ 
        "What is {query} in instruction formats?", 
        "How does {query} simplify instruction decoding?", 
        "Explain the importance of {query} in RISC and CISC architectures." 
    ],
    
    cpu_scaling: [ 
        "What is {query} in CPU frequency scaling?", 
        "How does {query} affect power consumption?", 
        "Explain dynamic voltage scaling and its role in {query}." 
    ],
    
    hardware_design: [ 
        "What is {query} in hardware design?", 
        "How does {query} contribute to system reliability?", 
        "Explain the trade-offs involved in {query} for performance vs. cost." 
    ],
    
    virtual_memory: [ 
        "What is {query} in virtual memory systems?", 
        "How does {query} manage address translation?", 
        "Explain the role of page tables in {query}." 
    ],
    
    pipeline_stages: [ 
        "What is {query} in pipeline stages?", 
        "How does {query} improve CPU throughput?", 
        "Explain the role of {query} in instruction pipelining." 
    ],
    
    addressing_modes: [ 
        "What is {query} in addressing modes?", 
        "How does {query} facilitate flexible memory access?", 
        "Explain the role of {query} in instruction execution." 
    ],
    
    coherence_protocols: [ 
        "What is {query} in cache coherence protocols?", 
        "How does {query} handle shared memory updates?", 
        "Explain the advantages of {query} in multiprocessor systems." 
    ],
    
    hardware_security: [ 
        "What is {query} in hardware security?", 
        "How does {query} prevent unauthorized access?", 
        "Explain the role of {query} in secure system design." 
    ],
    
    gpu_architecture: [ 
        "What is {query} in GPU architecture?", 
        "How does {query} accelerate parallel computing tasks?", 
        "Explain the differences between {query} in CPUs and GPUs." 
    ],
    
    memory_allocation: [ 
        "What is {query} in memory allocation?", 
        "How does {query} optimize memory usage?", 
        "Explain the role of {query} in dynamic memory management." 
    ],
    
    network_on_chip: [ 
        "What is {query} in Network-on-Chip (NoC)?", 
        "How does {query} handle data communication in multicore processors?", 
        "Explain the benefits of {query} over traditional bus systems." 
    ],
    
    logic_gates: [ 
        "What is {query} in logic gate design?", 
        "How does {query} contribute to combinational circuits?", 
        "Explain the role of {query} in digital system design." 
    ],
    
    fpga: [ 
        "What is {query} in FPGA architecture?", 
        "How does {query} enable hardware reconfiguration?", 
        "Explain the use of {query} in prototyping and production systems." 
    ],
    
    system_clocks: [ 
        "What is {query} in system clock design?", 
        "How does {query} synchronize processor operations?", 
        "Explain clock skew and its effect on {query}." 
    ],
    bus_communication: [ 
        "What is {query} in bus communication protocols?", 
        "How does {query} impact bus arbitration?", 
        "Explain the role of {query} in synchronous and asynchronous buses." 
    ],
    
    instruction_decoding: [ 
        "What is {query} in instruction decoding?", 
        "How does {query} affect execution cycles?", 
        "Explain the process of {query} in CPU instruction handling." 
    ],
    
    data_cache: [ 
        "What is {query} in data caching?", 
        "How does {query} improve memory access efficiency?", 
        "Explain cache miss penalties caused by {query}." 
    ],
    
    pipeline_hazards: [ 
        "What is {query} in pipeline hazards?", 
        "How does {query} stall CPU performance?", 
        "Explain techniques to mitigate {query} in instruction pipelines." 
    ],
    
    multithreading: [ 
        "What is {query} in multithreading?", 
        "How does {query} differ from multiprocessing?", 
        "Explain the advantages and challenges of {query} in CPUs." 
    ],
    
    storage_devices: [ 
        "What is {query} in storage device architecture?", 
        "How does {query} compare between SSDs and HDDs?", 
        "Explain the impact of {query} on read/write performance." 
    ],
    
    cache_optimization: [ 
        "What is {query} in cache optimization?", 
        "How does {query} affect cache hit rates?", 
        "Explain strategies for improving {query} in cache design." 
    ],
    
    branch_handling: [ 
        "What is {query} in branch handling?", 
        "How does {query} improve control flow in pipelines?", 
        "Explain the effects of {query} on branch prediction accuracy." 
    ],
    
    instruction_formats: [ 
        "What is {query} in instruction formats?", 
        "How does {query} simplify instruction decoding?", 
        "Explain the importance of {query} in RISC and CISC architectures." 
    ],
    
    cpu_scaling: [ 
        "What is {query} in CPU frequency scaling?", 
        "How does {query} affect power consumption?", 
        "Explain dynamic voltage scaling and its role in {query}." 
    ],
    
    hardware_design: [ 
        "What is {query} in hardware design?", 
        "How does {query} contribute to system reliability?", 
        "Explain the trade-offs involved in {query} for performance vs. cost." 
    ],
    
    virtual_memory: [ 
        "What is {query} in virtual memory systems?", 
        "How does {query} manage address translation?", 
        "Explain the role of page tables in {query}." 
    ],
    
    pipeline_stages: [ 
        "What is {query} in pipeline stages?", 
        "How does {query} improve CPU throughput?", 
        "Explain the role of {query} in instruction pipelining." 
    ],
    
    addressing_modes: [ 
        "What is {query} in addressing modes?", 
        "How does {query} facilitate flexible memory access?", 
        "Explain the role of {query} in instruction execution." 
    ],
    
    coherence_protocols: [ 
        "What is {query} in cache coherence protocols?", 
        "How does {query} handle shared memory updates?", 
        "Explain the advantages of {query} in multiprocessor systems." 
    ],
    
    hardware_security: [ 
        "What is {query} in hardware security?", 
        "How does {query} prevent unauthorized access?", 
        "Explain the role of {query} in secure system design." 
    ],
    
    gpu_architecture: [ 
        "What is {query} in GPU architecture?", 
        "How does {query} accelerate parallel computing tasks?", 
        "Explain the differences between {query} in CPUs and GPUs." 
    ],
    
    memory_allocation: [ 
        "What is {query} in memory allocation?", 
        "How does {query} optimize memory usage?", 
        "Explain the role of {query} in dynamic memory management." 
    ],
    
    network_on_chip: [ 
        "What is {query} in Network-on-Chip (NoC)?", 
        "How does {query} handle data communication in multicore processors?", 
        "Explain the benefits of {query} over traditional bus systems." 
    ],
    
    logic_gates: [ 
        "What is {query} in logic gate design?", 
        "How does {query} contribute to combinational circuits?", 
        "Explain the role of {query} in digital system design." 
    ],
    
    fpga: [ 
        "What is {query} in FPGA architecture?", 
        "How does {query} enable hardware reconfiguration?", 
        "Explain the use of {query} in prototyping and production systems." 
    ],
    
    system_clocks: [ 
        "What is {query} in system clock design?", 
        "How does {query} synchronize processor operations?", 
        "Explain clock skew and its effect on {query}." 
    ],
    instruction_pipelines: [ 
        "What is {query} in instruction pipelines?", 
        "How does {query} impact instruction throughput?", 
        "Explain the challenges of {query} in pipeline execution." 
    ],
    
    parallel_processing: [ 
        "What is {query} in parallel processing?", 
        "How does {query} optimize task execution?", 
        "Explain the role of {query} in multicore processors." 
    ],
    
    alu_operations: [ 
        "What is {query} in ALU operations?", 
        "How does {query} affect arithmetic and logic processing?", 
        "Explain the design considerations of {query} in an ALU." 
    ],
    
    register_files: [ 
        "What is {query} in register file design?", 
        "How does {query} improve data access speed?", 
        "Explain the role of {query} in instruction execution." 
    ],
    
    memory_bottlenecks: [ 
        "What is {query} in memory bottlenecks?", 
        "How does {query} affect overall system performance?", 
        "Explain solutions to address {query} in memory subsystems." 
    ],
    
    bus_arbitration: [ 
        "What is {query} in bus arbitration?", 
        "How does {query} resolve conflicts in shared resources?", 
        "Explain the types of {query} used in bus systems." 
    ],
    
    control_unit_design: [ 
        "What is {query} in control unit design?", 
        "How does {query} manage instruction execution?", 
        "Explain the differences between {query} in hardwired and microprogrammed control units." 
    ],
    
    address_decoding: [ 
        "What is {query} in address decoding?", 
        "How does {query} enable efficient memory mapping?", 
        "Explain the techniques for implementing {query} in hardware." 
    ],
    
    instruction_set_architecture: [ 
        "What is {query} in instruction set architecture (ISA)?", 
        "How does {query} affect software and hardware compatibility?", 
        "Explain the design trade-offs involved in {query} for RISC and CISC architectures." 
    ],
    
    multiprocessor_architectures: [ 
        "What is {query} in multiprocessor architectures?", 
        "How does {query} improve parallelism?", 
        "Explain the challenges of {query} in shared memory systems." 
    ],
    
    error_detection_correction: [ 
        "What is {query} in error detection and correction?", 
        "How does {query} ensure data integrity?", 
        "Explain the role of {query} in memory and communication systems." 
    ],
    
    input_output_devices: [ 
        "What is {query} in I/O device communication?", 
        "How does {query} affect data transfer rates?", 
        "Explain the use of {query} in interrupt handling." 
    ],
    
    clock_cycles: [ 
        "What is {query} in clock cycles?", 
        "How does {query} affect CPU performance?", 
        "Explain the relationship between {query} and instruction execution time." 
    ],
    
    interrupt_handling: [ 
        "What is {query} in interrupt handling?", 
        "How does {query} manage asynchronous events?", 
        "Explain the priorities assigned during {query}." 
    ],
    
    bus_topologies: [ 
        "What is {query} in bus topologies?", 
        "How does {query} impact communication efficiency?", 
        "Explain the pros and cons of {query} in system design." 
    ],
    
    logic_circuits: [ 
        "What is {query} in logic circuits?", 
        "How does {query} contribute to digital system design?", 
        "Explain the differences between {query} in combinational and sequential logic." 
    ],
    
    virtualization: [ 
        "What is {query} in system virtualization?", 
        "How does {query} improve resource utilization?", 
        "Explain the role of {query} in hypervisors and virtual machines." 
    ],
    
    latency_vs_throughput: [ 
        "What is {query} in latency and throughput?", 
        "How does {query} affect system performance?", 
        "Explain the trade-offs between {query} in processor design." 
    ],
    
    energy_efficiency: [ 
        "What is {query} in energy-efficient computing?", 
        "How does {query} reduce power consumption?", 
        "Explain the design considerations for {query} in green computing." 
    ],
    
    system_architectures: [ 
        "What is {query} in system architectures?", 
        "How does {query} influence scalability?", 
        "Explain the evolution of {query} in computing systems." 
    ],
    
    cache_policies: [ 
        "What is {query} in cache replacement policies?", 
        "How does {query} optimize cache performance?", 
        "Explain the trade-offs involved in {query} for different workloads." 
    ],
    
    embedded_systems: [ 
        "What is {query} in embedded systems?", 
        "How does {query} ensure real-time performance?", 
        "Explain the role of {query} in system reliability." 
    ],
    
    pipeline_efficiency: [ 
        "What is {query} in pipeline efficiency?", 
        "How does {query} reduce stalls?", 
        "Explain the metrics used to evaluate {query} in pipelines." 
    ],
    
    hardware_acceleration: [ 
        "What is {query} in hardware acceleration?", 
        "How does {query} improve computational speed?", 
        "Explain the applications of {query} in specialized processors." 
    ],
    memory_hierarchy: [ 
        "What is {query} in the memory hierarchy?", 
        "How does {query} optimize data access?", 
        "Explain the trade-offs of {query} in memory system design." 
    ],
    
    data_path_design: [ 
        "What is {query} in data path design?", 
        "How does {query} influence instruction processing?", 
        "Explain the implementation challenges of {query} in modern CPUs." 
    ],
    
    multithreading: [ 
        "What is {query} in multithreading?", 
        "How does {query} improve CPU utilization?", 
        "Explain the role of {query} in hyper-threading technology." 
    ],
    
    addressing_modes: [ 
        "What is {query} in addressing modes?", 
        "How does {query} impact instruction flexibility?", 
        "Explain the advantages of using {query} in instruction sets." 
    ],
    
    load_balancing: [ 
        "What is {query} in load balancing?", 
        "How does {query} ensure efficient resource utilization?", 
        "Explain the challenges of implementing {query} in distributed systems." 
    ],
    
    microoperations: [ 
        "What is {query} in microoperations?", 
        "How does {query} relate to instruction execution?", 
        "Explain the significance of {query} in microarchitectures." 
    ],
    
    branch_prediction: [ 
        "What is {query} in branch prediction?", 
        "How does {query} reduce pipeline stalls?", 
        "Explain the algorithms used for {query} in modern processors." 
    ],
    
    coherence_protocols: [ 
        "What is {query} in cache coherence protocols?", 
        "How does {query} maintain consistency in multiprocessor systems?", 
        "Explain the trade-offs of {query} in shared memory architectures." 
    ],
    
    data_transfer: [ 
        "What is {query} in data transfer mechanisms?", 
        "How does {query} optimize I/O operations?", 
        "Explain the challenges of implementing {query} in high-speed networks." 
    ],
    
    instruction_fetch: [ 
        "What is {query} in instruction fetch cycles?", 
        "How does {query} impact overall CPU performance?", 
        "Explain the techniques used to optimize {query} in pipelines." 
    ],
    
    bus_structures: [ 
        "What is {query} in bus structures?", 
        "How does {query} affect system scalability?", 
        "Explain the trade-offs of {query} in high-performance systems." 
    ],
    
    floating_point_operations: [ 
        "What is {query} in floating-point operations?", 
        "How does {query} enhance numerical computation?", 
        "Explain the standards for {query} in modern processors." 
    ],
    
    logic_gates: [ 
        "What is {query} in the design of logic gates?", 
        "How does {query} enable digital circuit functionality?", 
        "Explain the differences between {query} in combinational logic." 
    ],
    
    system_on_chip: [ 
        "What is {query} in system-on-chip (SoC) design?", 
        "How does {query} integrate components into a single chip?", 
        "Explain the advantages of {query} in mobile and embedded systems." 
    ],
    
    arithmetic_units: [ 
        "What is {query} in arithmetic units?", 
        "How does {query} perform calculations?", 
        "Explain the design challenges of {query} in ALUs." 
    ],
    
    clock_skew: [ 
        "What is {query} in clock skew management?", 
        "How does {query} affect synchronization?", 
        "Explain the techniques to minimize {query} in high-speed circuits." 
    ],
    
    virtual_memory: [ 
        "What is {query} in virtual memory systems?", 
        "How does {query} support memory management?", 
        "Explain the benefits and limitations of {query} in operating systems." 
    ],
    
    data_hazards: [ 
        "What is {query} in data hazards?", 
        "How does {query} impact pipeline performance?", 
        "Explain the methods to mitigate {query} in modern CPUs." 
    ],
    
    instruction_decoding: [ 
        "What is {query} in instruction decoding?", 
        "How does {query} enable instruction execution?", 
        "Explain the design principles of {query} in processors." 
    ],
    
    power_management: [ 
        "What is {query} in power management?", 
        "How does {query} optimize energy consumption?", 
        "Explain the role of {query} in low-power processor design." 
    ],
    
    feedback_control: [ 
        "What is {query} in feedback control systems?", 
        "How does {query} maintain system stability?", 
        "Explain the importance of {query} in real-time applications." 
    ],
    
    shared_memory: [ 
        "What is {query} in shared memory architectures?", 
        "How does {query} support parallel processing?", 
        "Explain the challenges of maintaining {query} in multiprocessor systems." 
    ],
    
    pipeline_bubbles: [ 
        "What is {query} in pipeline bubbles?", 
        "How does {query} affect execution flow?", 
        "Explain strategies to minimize {query} in instruction pipelines." 
    ],
    
    address_translation: [ 
        "What is {query} in address translation?", 
        "How does {query} support virtual memory?", 
        "Explain the role of {query} in TLBs and paging systems." 
    ],
    
    network_on_chip: [ 
        "What is {query} in network-on-chip (NoC)?", 
        "How does {query} facilitate data communication?", 
        "Explain the design trade-offs of {query} in multicore processors." 
    ],
    digital_logic: [
        "What is {query} in digital logic design?",
        "How does {query} affect circuit performance?",
        "Explain the role of {query} in combinational and sequential circuits."
    ],
    
    number_systems: [
        "What is {query} in number systems?",
        "How does {query} help in digital system design?",
        "Explain conversions involving {query} in binary, decimal, and hexadecimal."
    ],
    
    cache_memory: [
        "What is {query} in cache memory?",
        "How does {query} optimize memory access?",
        "Explain the differences between {query} in direct-mapped and set-associative caches."
    ],
    
    instruction_sets: [
        "What is {query} in instruction set architecture?",
        "How does {query} impact instruction execution?",
        "Explain the importance of {query} in RISC vs. CISC."
    ],
    
    processor_pipelining: [
        "What is {query} in processor pipelining?",
        "How does {query} improve instruction throughput?",
        "Explain techniques to resolve {query} in pipeline hazards."
    ],
    
    error_correction: [
        "What is {query} in error correction codes?",
        "How does {query} ensure data integrity?",
        "Explain the role of {query} in memory reliability."
    ],
    
    input_output_systems: [
        "What is {query} in I/O systems?",
        "How does {query} improve data transfer rates?",
        "Explain the role of {query} in Direct Memory Access (DMA)."
    ],
    
    instruction_execution: [
        "What is {query} in instruction execution?",
        "How does {query} relate to the instruction cycle?",
        "Explain the role of {query} in instruction decoding."
    ],
    cpu_design: [
        "What is {query} in CPU design?",
        "How does {query} affect instruction scheduling?",
        "Explain the design challenges of {query} in modern processors."
    ],
    
    storage_technologies: [
        "What is {query} in storage technologies?",
        "How does {query} compare between SSDs and HDDs?",
        "Explain the impact of {query} on data retrieval speed."
    ],
    cpu_design: [
        "What is {query} in CPU design?",
        "How does {query} affect instruction scheduling?",
        "Explain the design challenges of {query} in modern processors."
    ],
    
    storage_technologies: [
        "What is {query} in storage technologies?",
        "How does {query} compare between SSDs and HDDs?",
        "Explain the impact of {query} on data retrieval speed."
    ],
    
    multicore_architecture: [
        "What is {query} in multicore architecture?",
        "How does {query} handle thread scheduling?",
        "Explain the challenges of {query} in shared memory systems."
    ],
    
    digital_design: [
        "What is {query} in digital circuit design?",
        "How does {query} impact RTL (Register Transfer Level) implementations?",
        "Explain the use of {query} in VHDL and Verilog."
    ],
    
    arithmetic_operations: [
        "What is {query} in arithmetic units?",
        "How does {query} handle fixed-point and floating-point operations?",
        "Explain the implementation of {query} in ALUs."
    ],
    
    scheduling_algorithms: [
        "What is {query} in scheduling algorithms?",
        "How does {query} optimize resource utilization?",
        "Explain the differences between {query} in preemptive and non-preemptive systems."
    ],
    boolean_algebra: [
        "What is {query} in Boolean algebra?",
        "How does {query} apply to digital circuit design?",
        "Explain the importance of {query} in logical expressions."
    ],
    
    sequential_circuits: [
        "What is {query} in sequential circuits?",
        "How does {query} differ from combinational circuits?",
        "Explain the role of {query} in flip-flops and memory design."
    ],
    
    combinational_circuits: [
        "What is {query} in combinational circuits?",
        "How does {query} optimize circuit performance?",
        "Explain the applications of {query} in arithmetic logic units."
    ],
    
    bus_interconnection: [
        "What is {query} in bus interconnection?",
        "How does {query} handle data communication in systems?",
        "Explain the significance of {query} in PCI and FireWire interfaces."
    ],
    
    processor_architecture: [
        "What is {query} in processor architecture?",
        "How does {query} impact instruction pipelining?",
        "Explain the role of {query} in x86 and ARM processors."
    ],
    
    memory_allocation: [
        "What is {query} in memory allocation?",
        "How does {query} manage dynamic memory?",
        "Explain the trade-offs of {query} in memory allocation techniques."
    ],
    
    fault_tolerance: [
        "What is {query} in fault tolerance systems?",
        "How does {query} improve system reliability?",
        "Explain the role of {query} in error detection and correction."
    ],
    
    microinstructions: [
        "What is {query} in microinstruction control?",
        "How does {query} execute operations at the hardware level?",
        "Explain the sequencing involved in {query} in microprogrammed control units."
    ],
    
    performance_metrics: [
        "What is {query} in performance metrics?",
        "How does {query} measure system efficiency?",
        "Explain the importance of {query} in benchmarking processors."
    ],
    
    instruction_parallelism: [
        "What is {query} in instruction-level parallelism?",
        "How does {query} improve execution throughput?",
        "Explain the techniques for implementing {query} in superscalar processors."
    ],
    
    multithreading: [
        "What is {query} in multithreading architectures?",
        "How does {query} improve task execution in multicore systems?",
        "Explain the synchronization challenges of {query} in multithreaded systems."
    ],
    
    floating_point_representation: [
        "What is {query} in floating-point representation?",
        "How does {query} ensure numerical accuracy?",
        "Explain the IEEE standards for {query} in computer arithmetic."
    ],
    
    pipeline_control: [
        "What is {query} in pipeline control?",
        "How does {query} handle hazards in pipelined architectures?",
        "Explain the significance of {query} in ensuring smooth pipeline execution."
    ],
    
    interrupt_handling: [
        "What is {query} in interrupt handling?",
        "How does {query} affect system performance?",
        "Explain the role of {query} in hardware and software interrupts."
    ],
    
    cache_coherence: [
        "What is {query} in cache coherence protocols?",
        "How does {query} ensure consistency in shared memory systems?",
        "Explain the differences between {query} in snooping and directory-based methods."
    ],
    
    arithmetic_circuits: [
        "What is {query} in arithmetic circuits?",
        "How does {query} optimize calculations in digital systems?",
        "Explain the trade-offs in designing {query} for speed and area efficiency."
    ],
    
    clocking_schemes: [
        "What is {query} in clocking schemes?",
        "How does {query} synchronize circuit operations?",
        "Explain the impact of {query} on performance and stability in systems."
    ],
    
    bus_protocols: [
        "What is {query} in bus protocols?",
        "How does {query} ensure data integrity during transfers?",
        "Explain the role of {query} in interconnection architectures."
    ],
    
    data_representation: [
        "What is {query} in data representation?",
        "How does {query} influence memory efficiency?",
        "Explain the importance of {query} in binary and hexadecimal formats."
    ],
    
    virtualization_techniques: [
        "What is {query} in virtualization techniques?",
        "How does {query} improve hardware resource management?",
        "Explain the implementation of {query} in hypervisors."
    ],
    
    control_hazards: [
        "What is {query} in control hazards?",
        "How does {query} impact branch prediction accuracy?",
        "Explain techniques to minimize {query} in pipelined processors."
    ],
    
    embedded_architectures: [
        "What is {query} in embedded architectures?",
        "How does {query} address power efficiency constraints?",
        "Explain the applications of {query} in IoT devices."
    ],
    
    signal_encoding: [
        "What is {query} in signal encoding?",
        "How does {query} affect digital communication systems?",
        "Explain the types of {query} used in data transmission."
    ],
    
    reduced_instruction_set: [
        "What is {query} in reduced instruction set computers (RISC)?",
        "How does {query} differ from complex instruction set computers (CISC)?",
        "Explain the advantages of {query} in modern processor design."
    ],
    
    dataflow_architecture: [
        "What is {query} in dataflow architectures?",
        "How does {query} optimize parallel computing?",
        "Explain the challenges of implementing {query} in real-time systems."
    ],
    
    instruction_formats: [
        "What is {query} in instruction formats?",
        "How does {query} affect decoding complexity?",
        "Explain the variations of {query} in x86 and ARM processors."
    ],
    
    branch_prediction: [
        "What is {query} in branch prediction algorithms?",
        "How does {query} minimize pipeline stalls?",
        "Explain the differences between static and dynamic {query} techniques."
    ],
    
    energy_optimization: [
        "What is {query} in energy optimization?",
        "How does {query} reduce power consumption in processors?",
        "Explain the role of {query} in green computing."
    ],
    
    memory_protection: [
        "What is {query} in memory protection mechanisms?",
        "How does {query} prevent unauthorized access?",
        "Explain the importance of {query} in virtual memory systems."
    ]      
        
};

module.exports = queryTemplates;
